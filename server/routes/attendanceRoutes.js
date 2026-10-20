import express from 'express';
import {
  recordAttendance,
  checkExistingSession,
  getAttendanceSessions,
  getAttendanceDetails,
  updateAttendanceSession,
  getStudentAttendanceHistory,
  getSubjectReport,
  getClassReport,
  getDailyReport,
  getSummaryMetrics,
  getMissingAttendance,
  exportAttendanceCSV,
  getMyAttendanceHistory,
} from '../controllers/lectureAttendanceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Attendance session CRUD & checks
router.post('/', protect, authorize('faculty', 'admin'), recordAttendance);
router.get('/check-session', protect, authorize('faculty', 'admin'), checkExistingSession);
router.get('/sessions', protect, authorize('faculty', 'admin'), getAttendanceSessions);
router.get('/sessions/:id', protect, authorize('faculty', 'admin'), getAttendanceDetails);
router.patch('/sessions/:id', protect, authorize('faculty', 'admin'), updateAttendanceSession);

// Individual student attendance report
router.get('/student/:studentId', protect, authorize('faculty', 'admin'), getStudentAttendanceHistory);

// Analytics & Reports
router.get('/reports/subject', protect, authorize('faculty', 'admin'), getSubjectReport);
router.get('/reports/class', protect, authorize('faculty', 'admin'), getClassReport);
router.get('/reports/daily', protect, authorize('faculty', 'admin'), getDailyReport);
router.get('/reports/summary', protect, authorize('faculty', 'admin'), getSummaryMetrics);
router.get('/missing', protect, authorize('faculty', 'admin'), getMissingAttendance);
router.get('/export-csv', protect, authorize('faculty', 'admin'), exportAttendanceCSV);

// Backward-compatible endpoints
router.get('/my-history', protect, authorize('faculty', 'admin'), getMyAttendanceHistory);
router.get('/:id', protect, authorize('faculty', 'admin'), getAttendanceDetails);

export default router;
