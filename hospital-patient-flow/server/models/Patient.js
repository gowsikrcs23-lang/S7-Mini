import mongoose from 'mongoose';
import Counter from './Counter.js';

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true, match: [/^\d{10}$/, 'Emergency phone must contain exactly 10 digits'] },
    relation: { type: String, trim: true }
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    phone: { type: String, required: true, trim: true, match: [/^\d{10}$/, 'Phone number must contain exactly 10 digits'] },
    address: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    medicalCondition: { type: String, trim: true },
    emergencyContact: emergencyContactSchema,
    priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
    status: { type: String, enum: ['Registered', 'Waiting', 'Admitted', 'Discharged'], default: 'Registered' }
  },
  { timestamps: true }
);

patientSchema.pre('save', async function assignPatientId(next) {
  if (this.patientId) return next();

  // Keep the sequence ahead of any IDs that already exist, including data
  // created before the counter was introduced or after patients were deleted.
  const latestPatient = await mongoose.model('Patient')
    .findOne({ patientId: /^PAT-\d+$/ })
    .sort({ patientId: -1 })
    .select('patientId')
    .lean();
  const latestNumber = Number(latestPatient?.patientId?.replace('PAT-', '')) || 0;

  const counter = await Counter.findOneAndUpdate(
    { _id: 'patientId' },
    [
      {
        $set: {
          seq: {
            $add: [
              { $max: [{ $ifNull: ['$seq', 0] }, latestNumber] },
              1
            ]
          }
        }
      }
    ],
    { upsert: true, new: true }
  );

  this.patientId = `PAT-${String(counter.seq).padStart(5, '0')}`;
  next();
});

export default mongoose.model('Patient', patientSchema);
