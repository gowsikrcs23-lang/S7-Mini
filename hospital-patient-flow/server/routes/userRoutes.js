import express from 'express';
import { createUser, deleteUser, getUsers, updateUser } from '../controllers/userController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('Admin'));
router.route('/').get(getUsers).post(createUser);
router.route('/:id').put(updateUser).delete(deleteUser);

export default router;
