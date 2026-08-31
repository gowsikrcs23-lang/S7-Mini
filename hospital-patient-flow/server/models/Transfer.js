import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    fromBed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
    toBed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
    fromWard: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
    toWard: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
    reason: { type: String, required: true, trim: true },
    transferDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Transfer', transferSchema);
