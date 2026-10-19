import express from 'express';
import {
  getSubjects,
  getMyAssignedSubjects,
  createSubject,
  getClasses,
  createClass,
  getClassStudents,
} from '../controllers/subjectClassController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Subjects
router.get('/subjects', protect, getSubjects);
router.get('/subjects/my', protect, authorize('faculty', 'admin'), getMyAssignedSubjects);
router.post('/subjects', protect, authorize('admin'), createSubject);

// Classes & Divisions
router.get('/classes', protect, getClasses);
router.post('/classes', protect, authorize('admin'), createClass);
router.get('/classes/:id/students', protect, authorize('faculty', 'admin'), getClassStudents);

export default router;
