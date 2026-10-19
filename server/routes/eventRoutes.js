import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  registerForEvent,
  cancelRegistration,
  getEventAttendees,
  checkInAttendee,
} from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', protect, getEventById);
router.post('/', protect, authorize('admin', 'faculty', 'coordinator'), createEvent);
router.put('/:id', protect, updateEvent);
router.post('/:id/register', protect, registerForEvent);
router.post('/:id/cancel', protect, cancelRegistration);
router.get('/:id/attendees', protect, getEventAttendees);
router.post('/:id/checkin', protect, checkInAttendee);

export default router;
