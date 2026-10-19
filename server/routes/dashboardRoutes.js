import express from 'express';
import { getStudentDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getStudentDashboard);

export default router;
