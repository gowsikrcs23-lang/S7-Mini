import express from 'express';
import { activity, charts, reports, stats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/stats', stats);
router.get('/charts', charts);
router.get('/activity', activity);
router.get('/reports', reports);

export default router;
