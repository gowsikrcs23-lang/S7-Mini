import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema(
  {
    bedNumber: { type: String, required: true, unique: true, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
    floor: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Standard', 'ICU', 'Emergency', 'Pediatric', 'Maternity'], required: true },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'],
      default: 'Available'
    },
    assignedPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

bedSchema.index({ ward: 1, status: 1 });
bedSchema.index({ assignedPatient: 1 });

export default mongoose.model('Bed', bedSchema);
