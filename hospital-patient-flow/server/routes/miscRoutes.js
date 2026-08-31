import express from 'express';
import { createWaitingQueue, getNotifications, getWaitingQueue, readNotification } from '../controllers/miscController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.route('/waiting-queue').get(getWaitingQueue).post(createWaitingQueue);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', readNotification);

export default router;
