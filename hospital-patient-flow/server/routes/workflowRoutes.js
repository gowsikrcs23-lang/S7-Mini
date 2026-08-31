import express from 'express';
import {
  admitPatient,
  dischargePatient,
  getAdmissions,
  getDischarges,
  getTransfers,
  recommendBed,
  transferPatient
} from '../controllers/workflowController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/recommend-bed', recommendBed);
router.route('/admissions').get(getAdmissions).post(admitPatient);
router.route('/transfers').get(getTransfers).post(transferPatient);
router.route('/discharges').get(getDischarges).post(dischargePatient);

export default router;
