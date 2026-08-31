import Bed from '../models/Bed.js';
import Ward from '../models/Ward.js';
import { emitHospitalEvent } from '../socket/index.js';
import { createNotification, evaluateBedAlerts } from '../services/notificationService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId, requireFields } from '../utils/validators.js';

const populateBed = (query) => query.populate('ward').populate('assignedPatient', 'patientId name priority status');

const floorPlan = [
  { name: 'Emergency', floor: '0', type: 'Emergency', beds: 10, prefix: 'F0' },
  { name: 'Floor 1 Ward', floor: '1', type: 'General', beds: 10, prefix: 'F1' },
  { name: 'General Ward', floor: '2', type: 'General', beds: 10, prefix: 'F2' },
  { name: 'ICU', floor: '3', type: 'Critical Care', beds: 10, prefix: 'F3' },
  { name: 'Maternity', floor: '4', type: 'Maternity', beds: 8, prefix: 'F4-M' },
  { name: 'Pediatric', floor: '4', type: 'Children', beds: 4, prefix: 'F4-P' }
];

export const getBeds = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.ward) query.ward = req.query.ward;
  if (req.query.status) query.status = req.query.status;
  if (req.query.type) query.type = req.query.type;
  const beds = await populateBed(Bed.find(query).sort({ bedNumber: 1 }));
  res.json(beds);
});

export const getAvailableBeds = asyncHandler(async (req, res) => {
  const query = { status: 'Available', assignedPatient: null };
  if (req.query.ward) query.ward = req.query.ward;
  const beds = await populateBed(Bed.find(query).sort({ bedNumber: 1 }));
  res.json(beds);
});

export const createBed = asyncHandler(async (req, res) => {
  requireFields(req.body, ['bedNumber', 'roomNumber', 'floor', 'type']);

  let ward;
  if (req.body.ward) {
    assertObjectId(req.body.ward, 'Ward');
    ward = await Ward.findById(req.body.ward);
    if (!ward) throw new ApiError(404, 'Ward not found');
  } else {
    const floorValue = String(req.body.floor);
    const floorNumber = floorValue.split(' ')[0];
    let wardName;
    let wardType;

    if (floorNumber === '0') {
      wardName = 'Emergency';
      wardType = 'Emergency';
    } else if (floorNumber === '1') {
      wardName = 'Floor 1 Ward';
      wardType = 'General';
    } else if (floorNumber === '2') {
      wardName = 'General Ward';
      wardType = 'General';
    } else if (floorNumber === '3') {
      wardName = 'ICU';
      wardType = 'Critical Care';
    } else if (floorNumber === '4') {
      wardName = req.body.type === 'Maternity' ? 'Maternity' : req.body.type === 'Pediatric' ? 'Pediatric' : 'Floor 4 Ward';
      wardType = req.body.type;
    } else if (floorNumber === '5') {
      wardName = floorValue.replace(/^5\s*-\s*/, '').trim();
      wardType = req.body.type;
      if (!wardName) throw new ApiError(400, 'Other floor / department name is required');
    } else {
      throw new ApiError(400, 'Select a valid floor from 0 to 5');
    }

    ward = await Ward.findOneAndUpdate(
      { name: wardName },
      { $set: { floor: floorNumber, type: wardType }, $setOnInsert: { name: wardName } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  const bed = await Bed.create({ ...req.body, ward: ward._id });
  await Ward.findByIdAndUpdate(ward._id, { $inc: { totalBeds: 1 } });
  const populated = await populateBed(Bed.findById(bed._id));
  emitHospitalEvent('bedUpdated', populated);
  res.status(201).json(populated);
});

export const createFloorPlan = asyncHandler(async (req, res) => {
  let created = 0;
  let existing = 0;

  for (const plan of floorPlan) {
    const ward = await Ward.findOneAndUpdate(
      { name: plan.name },
      { $set: { floor: plan.floor, type: plan.type }, $setOnInsert: { name: plan.name } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const wardBeds = await Bed.find({ ward: ward._id }).sort({ createdAt: 1, _id: 1 });

    for (let number = 1; number <= plan.beds; number += 1) {
      const suffix = String(number).padStart(2, '0');
      const bedNumber = `${plan.prefix}-B${suffix}`;
      const roomNumber = `${plan.prefix}-R${suffix}`;

      let bed = await Bed.findOne({ bedNumber });
      if (!bed) bed = wardBeds[number - 1];

      if (bed) {
        const conflictingBed = await Bed.findOne({ bedNumber, _id: { $ne: bed._id } });
        if (conflictingBed) {
          existing += 1;
          continue;
        }

        bed.bedNumber = bedNumber;
        bed.roomNumber = roomNumber;
        bed.floor = plan.floor;
        bed.type = plan.name === 'Emergency' ? 'Emergency' : plan.name === 'ICU' ? 'ICU' : plan.name === 'Maternity' ? 'Maternity' : plan.name === 'Pediatric' ? 'Pediatric' : 'Standard';
        await bed.save();
        existing += 1;
        continue;
      }

      await Bed.create({
        bedNumber,
        roomNumber,
        ward: ward._id,
        floor: plan.floor,
        type: plan.name === 'Emergency' ? 'Emergency' : plan.name === 'ICU' ? 'ICU' : plan.name === 'Maternity' ? 'Maternity' : plan.name === 'Pediatric' ? 'Pediatric' : 'Standard',
        status: 'Available'
      });
      created += 1;
    }

    const totalBeds = await Bed.countDocuments({ ward: ward._id });
    await Ward.findByIdAndUpdate(ward._id, { totalBeds });
  }

  emitHospitalEvent('bedUpdated', { floorPlan: true });
  res.status(201).json({ message: 'Hospital floor plan is ready', created, existing, total: created + existing });
});

export const updateBed = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Bed');
  const previous = await Bed.findById(req.params.id);
  if (!previous) throw new ApiError(404, 'Bed not found');
  if (req.body.status === 'Available') req.body.assignedPatient = null;
  req.body.lastUpdated = new Date();
  const bed = await Bed.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('ward')
    .populate('assignedPatient', 'patientId name priority status');

  if (previous.status !== 'Available' && bed.status === 'Available') {
    await createNotification({
      type: 'bed_available',
      message: `${bed.bedNumber} in ${bed.ward.name} is now available`,
      severity: 'success'
    });
  }
  await evaluateBedAlerts();
  emitHospitalEvent('bedUpdated', bed);
  res.json(bed);
});

export const deleteBed = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Bed');
  const bed = await Bed.findById(req.params.id);
  if (!bed) throw new ApiError(404, 'Bed not found');
  if (bed.status === 'Occupied') throw new ApiError(400, 'Cannot delete an occupied bed');
  await bed.deleteOne();
  await Ward.findByIdAndUpdate(bed.ward, { $inc: { totalBeds: -1 } });
  emitHospitalEvent('bedUpdated', { deletedBedId: req.params.id });
  res.json({ message: 'Bed deleted' });
});

export const getWards = asyncHandler(async (req, res) => {
  const wards = await Ward.find().sort({ name: 1 });
  res.json(wards);
});

export const createWard = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'floor', 'type']);
  const ward = await Ward.create(req.body);
  res.status(201).json(ward);
});
