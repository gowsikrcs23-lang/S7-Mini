import Notification from '../models/Notification.js';
import WaitingQueue from '../models/WaitingQueue.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertObjectId, requireFields } from '../utils/validators.js';

const priorityWeight = { Critical: 1, High: 2, Medium: 3, Low: 4 };

export const getWaitingQueue = asyncHandler(async (req, res) => {
  const queue = await WaitingQueue.find(req.query.status ? { status: req.query.status } : {})
    .populate('patient')
    .populate('requiredWard')
    .sort({ waitingSince: 1 });
  queue.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority] || a.waitingSince - b.waitingSince);
  res.json(queue);
});

export const createWaitingQueue = asyncHandler(async (req, res) => {
  requireFields(req.body, ['patient', 'requiredWard', 'priority']);
  const item = await WaitingQueue.create(req.body);
  res.status(201).json(await item.populate(['patient', 'requiredWard']));
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

export const readNotification = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Notification');
  const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  res.json(notification);
});
