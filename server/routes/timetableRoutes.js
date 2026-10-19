import express from 'express';
import {
  getMyTimetable,
  getAdminTimetable,
  checkConflictEndpoint,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from '../controllers/academicScheduleController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Faculty & Admin: Get my published schedule
router.get('/my', protect, getMyTimetable);

// Conflict check dry run
router.post('/check-conflict', protect, authorize('admin'), checkConflictEndpoint);

// Admin Timetable Management
router.get('/admin', protect, authorize('admin'), getAdminTimetable);
router.post('/admin', protect, authorize('admin'), createTimetableEntry);
router.patch('/admin/:id', protect, authorize('admin'), updateTimetableEntry);
router.delete('/admin/:id', protect, authorize('admin'), deleteTimetableEntry);

export default router;
