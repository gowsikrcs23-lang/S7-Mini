import mongoose from 'mongoose';

const waitingQueueSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    requiredWard: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
    priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
    waitingSince: { type: Date, default: Date.now },
    status: { type: String, enum: ['Waiting', 'Assigned', 'Cancelled'], default: 'Waiting' }
  },
  { timestamps: true }
);

waitingQueueSchema.index({ patient: 1, status: 1 });

export default mongoose.model('WaitingQueue', waitingQueueSchema);
