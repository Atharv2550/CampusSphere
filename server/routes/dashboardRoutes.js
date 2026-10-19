import express from 'express';
import { getStudentDashboard, getFacultyDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, (req, res, next) => {
  if (req.user.role === 'faculty') {
    return getFacultyDashboard(req, res, next);
  }
  return getStudentDashboard(req, res, next);
});

router.get('/faculty', protect, getFacultyDashboard);
router.get('/student', protect, getStudentDashboard);

export default router;
