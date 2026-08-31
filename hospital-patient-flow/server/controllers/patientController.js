import Patient from '../models/Patient.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertEmergencyContact, assertObjectId, assertPhoneNumber, requireFields } from '../utils/validators.js';

export const getPatients = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const query = {};

  if (req.query.status) query.status = req.query.status;
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { patientId: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Patient.countDocuments(query)
  ]);

  res.json({ patients, total, page, pages: Math.ceil(total / limit) });
});

export const getPatient = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Patient');
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json(patient);
});

export const createPatient = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'age', 'gender', 'phone']);
  assertPhoneNumber(req.body.phone);
  assertEmergencyContact(req.body.emergencyContact);
  const patient = await Patient.create(req.body);
  res.status(201).json(patient);
});

export const updatePatient = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Patient');
  assertPhoneNumber(req.body.phone);
  assertEmergencyContact(req.body.emergencyContact);
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json(patient);
});

export const deletePatient = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Patient');
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found');
  if (patient.status === 'Admitted') throw new ApiError(400, 'Cannot delete an admitted patient');
  await patient.deleteOne();
  res.json({ message: 'Patient deleted' });
});
