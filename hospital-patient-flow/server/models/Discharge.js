import mongoose from 'mongoose';

const dischargeSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', required: true },
    dischargeDate: { type: Date, default: Date.now },
    dischargeSummary: { type: String, required: true, trim: true },
    doctor: { type: String, required: true, trim: true },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model('Discharge', dischargeSchema);
