import express from 'express';
import { createPatient, deletePatient, getPatient, getPatients, updatePatient } from '../controllers/patientController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getPatients).post(createPatient);
router.route('/:id').get(getPatient).put(updatePatient).delete(authorize('Admin'), deletePatient);

export default router;
