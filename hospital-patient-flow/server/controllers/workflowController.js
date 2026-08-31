import Admission from '../models/Admission.js';
import Bed from '../models/Bed.js';
import Discharge from '../models/Discharge.js';
import Patient from '../models/Patient.js';
import Transfer from '../models/Transfer.js';
import WaitingQueue from '../models/WaitingQueue.js';
import Ward from '../models/Ward.js';
import { emitHospitalEvent } from '../socket/index.js';
import { createNotification, evaluateBedAlerts } from '../services/notificationService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId, requireFields } from '../utils/validators.js';

const priorityRank = { Critical: 1, High: 2, Medium: 3, Low: 4 };

export const recommendBed = asyncHandler(async (req, res) => {
  const { ward, priority = 'Medium' } = req.query;
  if (!ward) throw new ApiError(400, 'Ward is required for recommendation');
  const wardDoc = await Ward.findById(ward);
  if (!wardDoc) throw new ApiError(404, 'Ward not found');

  const preferredWardNames = priority === 'Critical' ? ['ICU', 'Emergency', wardDoc.name] : [wardDoc.name];
  const preferredWards = await Ward.find({ name: { $in: preferredWardNames } });
  const wardIds = preferredWards.map((item) => item._id);
  const beds = await Bed.find({ ward: { $in: wardIds }, status: 'Available', assignedPatient: null }).populate('ward');

  const scored = beds
    .map((bed) => ({
      bed,
      score:
        (bed.ward._id.equals(wardDoc._id) ? 30 : 0) +
        (priorityRank[priority] ? 10 - priorityRank[priority] : 0) +
        (['ICU', 'Emergency'].includes(bed.ward.name) && priority === 'Critical' ? 25 : 0)
    }))
    .sort((a, b) => b.score - a.score);

  res.json({ recommendedBed: scored[0]?.bed || null, availableBeds: beds });
});

export const getAdmissions = asyncHandler(async (req, res) => {
  const admissions = await Admission.find()
    .populate('patient')
    .populate('bed')
    .populate('ward')
    .sort({ admissionDate: -1 });
  res.json(admissions);
});

export const admitPatient = asyncHandler(async (req, res) => {
  requireFields(req.body, ['patient', 'ward', 'doctor', 'diagnosis']);
  const { patient: patientId, bed: bedId, ward: wardId, doctor, diagnosis, admissionDate, priority } = req.body;
  assertObjectId(patientId, 'Patient');
  assertObjectId(wardId, 'Ward');

  let admission;

  const patient = await Patient.findById(patientId);
  if (!patient) throw new ApiError(404, 'Patient not found');
  if (patient.status === 'Admitted') throw new ApiError(400, 'Patient is already admitted');

  let selectedBedId = bedId;
  if (!selectedBedId) {
    const bed = await Bed.findOne({ ward: wardId, status: 'Available', assignedPatient: null });
    selectedBedId = bed?._id;
  }

  if (!selectedBedId) {
    const queue = await WaitingQueue.findOneAndUpdate(
      { patient: patientId, status: 'Waiting' },
      { patient: patientId, requiredWard: wardId, priority: priority || patient.priority, waitingSince: new Date(), status: 'Waiting' },
      { upsert: true, new: true }
    );
    patient.status = 'Waiting';
    await patient.save();
    admission = { waitingQueue: queue };
  } else {
    assertObjectId(selectedBedId, 'Bed');
    const bed = await Bed.findOneAndUpdate(
      { _id: selectedBedId, status: 'Available', assignedPatient: null },
      { status: 'Occupied', assignedPatient: patientId, lastUpdated: new Date() },
      { new: true }
    );
    if (!bed) throw new ApiError(409, 'Bed is already occupied or unavailable');

    [admission] = await Admission.create([
      { patient: patientId, bed: selectedBedId, ward: wardId, doctor, diagnosis, admissionDate: admissionDate || new Date(), status: 'Active' }
    ]);
    patient.status = 'Admitted';
    await patient.save();
    await WaitingQueue.updateMany({ patient: patientId, status: 'Waiting' }, { status: 'Assigned' });
  }

  if (admission?.waitingQueue) {
    await createNotification({ type: 'no_beds_available', message: 'Patient added to waiting queue', severity: 'warning' });
    emitHospitalEvent('dashboardUpdated');
    return res.status(202).json(admission);
  }

  const populated = await Admission.findById(admission._id).populate('patient').populate('bed').populate('ward');
  await createNotification({ type: 'new_admission', message: `${populated.patient.name} admitted to ${populated.bed.bedNumber}`, severity: 'success' });
  await evaluateBedAlerts();
  emitHospitalEvent('patientAdmitted', populated);
  res.status(201).json(populated);
});

export const getTransfers = asyncHandler(async (req, res) => {
  const transfers = await Transfer.find()
    .populate('patient')
    .populate('fromBed')
    .populate('toBed')
    .populate('fromWard')
    .populate('toWard')
    .sort({ transferDate: -1 });
  res.json(transfers);
});

export const transferPatient = asyncHandler(async (req, res) => {
  requireFields(req.body, ['patient', 'toBed', 'reason']);
  const { patient: patientId, toBed: toBedId, reason, transferDate } = req.body;
  assertObjectId(patientId, 'Patient');
  assertObjectId(toBedId, 'Bed');

  let transfer;

  const admission = await Admission.findOne({ patient: patientId, status: { $in: ['Active', 'Transferred'] } });
    if (!admission) throw new ApiError(404, 'Active admission not found');

    const currentBed = await Bed.findById(admission.bed);
    const destinationBed = await Bed.findOneAndUpdate(
      { _id: toBedId, status: 'Available', assignedPatient: null },
      { status: 'Occupied', assignedPatient: patientId, lastUpdated: new Date() },
      { new: true }
    );
    if (!destinationBed) throw new ApiError(409, 'Destination bed is unavailable');

    await Bed.findByIdAndUpdate(currentBed._id, { status: 'Available', assignedPatient: null, lastUpdated: new Date() });
    transfer = await Transfer.create(
      [{
        patient: patientId,
        fromBed: currentBed._id,
        toBed: destinationBed._id,
        fromWard: currentBed.ward,
        toWard: destinationBed.ward,
        reason,
        transferDate: transferDate || new Date()
      }]
    );
    transfer = transfer[0];
    admission.bed = destinationBed._id;
    admission.ward = destinationBed.ward;
    admission.status = 'Transferred';
    await admission.save();

  const populated = await Transfer.findById(transfer._id).populate('patient').populate('fromBed').populate('toBed').populate('fromWard').populate('toWard');
  await createNotification({ type: 'patient_transfer', message: `${populated.patient.name} transferred to ${populated.toBed.bedNumber}`, severity: 'info' });
  emitHospitalEvent('patientTransferred', populated);
  res.status(201).json(populated);
});

export const getDischarges = asyncHandler(async (req, res) => {
  const discharges = await Discharge.find().populate('patient').populate('admission').sort({ dischargeDate: -1 });
  res.json(discharges);
});

export const dischargePatient = asyncHandler(async (req, res) => {
  requireFields(req.body, ['patient', 'doctor', 'dischargeSummary']);
  const { patient: patientId, doctor, dischargeSummary, notes, dischargeDate } = req.body;
  assertObjectId(patientId, 'Patient');

  let discharge;

  const admission = await Admission.findOne({ patient: patientId, status: { $in: ['Active', 'Transferred'] } });
    if (!admission) throw new ApiError(404, 'Active admission not found');

    await Bed.findByIdAndUpdate(admission.bed, { status: 'Cleaning', assignedPatient: null, lastUpdated: new Date() });
    await Patient.findByIdAndUpdate(patientId, { status: 'Discharged' });
    admission.status = 'Discharged';
    admission.dischargeDate = dischargeDate || new Date();
    await admission.save();
    discharge = await Discharge.create(
      [{ patient: patientId, admission: admission._id, doctor, dischargeSummary, notes, dischargeDate: admission.dischargeDate }]
    );
    discharge = discharge[0];
  

  const populated = await Discharge.findById(discharge._id).populate('patient').populate('admission');
  await createNotification({ type: 'patient_discharge', message: `${populated.patient.name} discharged`, severity: 'success' });
  emitHospitalEvent('patientDischarged', populated);
  res.status(201).json(populated);
});
