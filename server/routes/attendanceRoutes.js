import express from 'express';
import {
  recordAttendance,
  getMyAttendanceHistory,
  getAttendanceDetails,
} from '../controllers/lectureAttendanceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.post('/', protect, authorize('faculty', 'admin'), recordAttendance);
router.get('/my-history', protect, authorize('faculty', 'admin'), getMyAttendanceHistory);
router.get('/:id', protect, authorize('faculty', 'admin'), getAttendanceDetails);

export default router;
