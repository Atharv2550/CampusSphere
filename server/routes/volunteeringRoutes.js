import express from 'express';
import {
  getActivities,
  getActivityById,
  createActivity,
  registerForActivity,
  getActivityVolunteers,
  verifyParticipation,
  getMyVolunteeringRecords,
} from '../controllers/volunteeringController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', getActivities);
router.get('/my-records', protect, getMyVolunteeringRecords);
router.get('/:id', getActivityById);
router.post('/', protect, authorize('admin', 'faculty', 'coordinator'), createActivity);
router.post('/:id/register', protect, registerForActivity);
router.get('/:id/volunteers', protect, getActivityVolunteers);
router.patch('/registrations/:registrationId/verify', protect, authorize('admin', 'faculty', 'coordinator'), verifyParticipation);

export default router;
