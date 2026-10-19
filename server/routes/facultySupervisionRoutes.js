import express from 'express';
import {
  getFacultySupervision,
  getFacultyApprovals,
  reviewVolunteeringApproval,
  reviewEventApproval,
} from '../controllers/facultySupervisionController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/supervision', protect, authorize('faculty', 'admin'), getFacultySupervision);
router.get('/approvals', protect, authorize('faculty', 'admin'), getFacultyApprovals);
router.post('/approvals/volunteering/:id', protect, authorize('faculty', 'admin'), reviewVolunteeringApproval);
router.post('/approvals/events/:id', protect, authorize('faculty', 'admin'), reviewEventApproval);

export default router;
