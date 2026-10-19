import express from 'express';
import {
  getMyDuties,
  getAdminDuties,
  createDuty,
  updateDutyStatus,
  deleteDuty,
} from '../controllers/dutyController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/my', protect, authorize('faculty', 'admin'), getMyDuties);
router.patch('/:id/status', protect, authorize('faculty', 'admin'), updateDutyStatus);

// Admin endpoints
router.get('/admin', protect, authorize('admin'), getAdminDuties);
router.post('/admin', protect, authorize('admin'), createDuty);
router.delete('/admin/:id', protect, authorize('admin'), deleteDuty);

export default router;
