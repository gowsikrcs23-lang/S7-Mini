import mongoose from 'mongoose';

const wardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    floor: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    totalBeds: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Ward', wardSchema);
