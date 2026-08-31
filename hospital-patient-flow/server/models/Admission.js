import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
    ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
    doctor: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    admissionDate: { type: Date, default: Date.now },
    dischargeDate: { type: Date },
    status: { type: String, enum: ['Active', 'Transferred', 'Discharged'], default: 'Active' }
  },
  { timestamps: true }
);

admissionSchema.index(
  { patient: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['Active', 'Transferred'] } } }
);

export default mongoose.model('Admission', admissionSchema);
