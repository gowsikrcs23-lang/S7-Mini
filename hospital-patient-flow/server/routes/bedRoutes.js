import express from 'express';
import { createBed, createFloorPlan, createWard, deleteBed, getAvailableBeds, getBeds, getWards, updateBed } from '../controllers/bedController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/wards', getWards);
router.post('/wards', authorize('Admin'), createWard);
router.post('/floor-plan', authorize('Admin'), createFloorPlan);
router.get('/available', getAvailableBeds);
router.route('/').get(getBeds).post(authorize('Admin'), createBed);
router.route('/:id').put(updateBed).delete(authorize('Admin'), deleteBed);

export default router;
