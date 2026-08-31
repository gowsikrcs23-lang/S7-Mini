import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Admission from '../models/Admission.js';
import Bed from '../models/Bed.js';
import Discharge from '../models/Discharge.js';
import Notification from '../models/Notification.js';
import Patient from '../models/Patient.js';
import Transfer from '../models/Transfer.js';
import User from '../models/User.js';
import WaitingQueue from '../models/WaitingQueue.js';
import Ward from '../models/Ward.js';

dotenv.config();

const priorities = ['Critical', 'High', 'Medium', 'Low'];
const genders = ['Male', 'Female', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const conditions = ['Chest pain', 'Fracture', 'Fever', 'Pregnancy care', 'Pediatric fever', 'Post surgery', 'Observation'];

const run = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany(),
    Patient.deleteMany(),
    Ward.deleteMany(),
    Bed.deleteMany(),
    Admission.deleteMany(),
    Transfer.deleteMany(),
    Discharge.deleteMany(),
    WaitingQueue.deleteMany(),
    Notification.deleteMany()
  ]);

  await User.create([
    { name: 'Admin User', email: 'admin@hospital.com', password: 'Admin@123', role: 'Admin' },
    { name: 'Staff User', email: 'staff@hospital.com', password: 'Staff@123', role: 'Staff' }
  ]);

  const wardDocs = await Ward.create([
    { name: 'General Ward', floor: '1', type: 'General', totalBeds: 4 },
    { name: 'ICU', floor: '2', type: 'Critical Care', totalBeds: 4 },
    { name: 'Emergency', floor: 'Ground', type: 'Emergency', totalBeds: 4 },
    { name: 'Pediatric', floor: '3', type: 'Children', totalBeds: 4 },
    { name: 'Maternity', floor: '4', type: 'Maternity', totalBeds: 4 }
  ]);

  const patients = [];
  for (let index = 1; index <= 24; index += 1) {
    patients.push({
      name: `Patient ${index}`,
      age: 18 + (index % 55),
      gender: genders[index % genders.length],
      phone: `9876500${String(index).padStart(3, '0')}`,
      address: `${index}, Health Street`,
      bloodGroup: bloodGroups[index % bloodGroups.length],
      medicalCondition: conditions[index % conditions.length],
      emergencyContact: { name: `Contact ${index}`, phone: `9000000${String(index).padStart(3, '0')}`, relation: 'Family' },
      priority: priorities[index % priorities.length],
      status: index <= 12 ? 'Admitted' : index <= 16 ? 'Discharged' : 'Registered'
    });
  }
  const patientDocs = await Patient.create(patients);

  const beds = [];
  for (const ward of wardDocs) {
    for (let number = 1; number <= 4; number += 1) {
      const prefix = ward.name === 'General Ward' ? 'GEN' : ward.name.slice(0, 3).toUpperCase();
      beds.push({
        bedNumber: `${prefix}-${String(number).padStart(2, '0')}`,
        roomNumber: `${ward.floor === 'Ground' ? 'G' : ward.floor}-${String(number).padStart(2, '0')}`,
        ward: ward._id,
        floor: ward.floor,
        type: ward.name === 'General Ward' ? 'Standard' : ward.name === 'ICU' ? 'ICU' : ward.name,
        status: 'Available'
      });
    }
  }
  const bedDocs = await Bed.create(beds);

  const admissionDocs = [];
  for (let index = 0; index < 12; index += 1) {
    const bed = bedDocs[index];
    const patient = patientDocs[index];
    bed.status = 'Occupied';
    bed.assignedPatient = patient._id;
    bed.lastUpdated = new Date();
    await bed.save();
    admissionDocs.push({
      patient: patient._id,
      bed: bed._id,
      ward: bed.ward,
      doctor: `Dr. ${['Rao', 'Mehta', 'Iyer', 'Shah'][index % 4]}`,
      diagnosis: patient.medicalCondition,
      admissionDate: new Date(Date.now() - index * 86400000),
      status: index % 5 === 0 ? 'Transferred' : 'Active'
    });
  }
  const admissions = await Admission.create(admissionDocs);

  for (let index = 12; index < 16; index += 1) {
    const patient = patientDocs[index];
    const bed = bedDocs[index];
    const admission = await Admission.create({
      patient: patient._id,
      bed: bed._id,
      ward: bed.ward,
      doctor: 'Dr. Nair',
      diagnosis: patient.medicalCondition,
      admissionDate: new Date(Date.now() - (index + 3) * 86400000),
      dischargeDate: new Date(Date.now() - index * 43200000),
      status: 'Discharged'
    });
    await Discharge.create({
      patient: patient._id,
      admission: admission._id,
      doctor: 'Dr. Nair',
      dischargeSummary: 'Stable condition at discharge',
      notes: 'Follow up after one week',
      dischargeDate: admission.dischargeDate
    });
  }

  await Bed.updateMany({ bedNumber: { $in: ['ICU-03', 'EME-03'] } }, { status: 'Cleaning' });
  await Bed.updateMany({ bedNumber: { $in: ['GEN-04', 'PED-04'] } }, { status: 'Maintenance' });
  await Bed.updateMany({ bedNumber: { $in: ['MAT-03', 'MAT-04'] } }, { status: 'Reserved' });

  await WaitingQueue.create([
    { patient: patientDocs[16]._id, requiredWard: wardDocs[1]._id, priority: 'Critical', status: 'Waiting' },
    { patient: patientDocs[17]._id, requiredWard: wardDocs[2]._id, priority: 'High', status: 'Waiting' }
  ]);
  await Notification.create([
    { type: 'icu_nearly_full', message: 'ICU nearly full: monitor critical-care allocation', severity: 'warning' },
    { type: 'high_priority_waiting', message: 'High-priority patients are waiting for beds', severity: 'danger' },
    { type: 'new_admission', message: `${patientDocs[0].name} admitted successfully`, severity: 'success' }
  ]);

  if (admissions[0] && bedDocs[16]) {
    const oldBed = await Bed.findById(admissions[0].bed);
    const newBed = bedDocs[16];
    oldBed.status = 'Available';
    oldBed.assignedPatient = null;
    await oldBed.save();
    newBed.status = 'Occupied';
    newBed.assignedPatient = admissions[0].patient;
    await newBed.save();
    admissions[0].bed = newBed._id;
    admissions[0].ward = newBed.ward;
    admissions[0].status = 'Transferred';
    await admissions[0].save();
    await Transfer.create({
      patient: admissions[0].patient,
      fromBed: oldBed._id,
      toBed: newBed._id,
      fromWard: oldBed.ward,
      toWard: newBed.ward,
      reason: 'Clinical monitoring upgrade'
    });
  }

  console.log('Seed completed');
  console.log('Admin: admin@hospital.com / Admin@123');
  console.log('Staff: staff@hospital.com / Staff@123');
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
