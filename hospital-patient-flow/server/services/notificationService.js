import Bed from '../models/Bed.js';
import Notification from '../models/Notification.js';
import WaitingQueue from '../models/WaitingQueue.js';
import { emitHospitalEvent } from '../socket/index.js';

export const createNotification = async ({ type, message, severity = 'info' }) => {
  const notification = await Notification.create({ type, message, severity });
  emitHospitalEvent('notificationCreated', notification);
  return notification;
};

export const evaluateBedAlerts = async () => {
  const grouped = await Bed.aggregate([
    { $lookup: { from: 'wards', localField: 'ward', foreignField: '_id', as: 'ward' } },
    { $unwind: '$ward' },
    {
      $group: {
        _id: '$ward.name',
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } }
      }
    }
  ]);

  for (const ward of grouped) {
    const occupancy = ward.total ? 1 - ward.available / ward.total : 0;
    if (['ICU', 'Emergency'].includes(ward._id) && occupancy >= 0.85) {
      await createNotification({
        type: `${ward._id.toLowerCase()}_nearly_full`,
        message: `${ward._id} nearly full: ${ward.available} beds available`,
        severity: 'warning'
      });
    }
    if (ward.available === 0) {
      await createNotification({
        type: 'no_beds_available',
        message: `No available beds in ${ward._id}`,
        severity: 'danger'
      });
    }
  }

  const highPriorityWaiting = await WaitingQueue.countDocuments({
    priority: { $in: ['Critical', 'High'] },
    status: 'Waiting'
  });
  if (highPriorityWaiting > 0) {
    await createNotification({
      type: 'high_priority_waiting',
      message: `${highPriorityWaiting} high-priority patient(s) waiting for beds`,
      severity: 'danger'
    });
  }
};
