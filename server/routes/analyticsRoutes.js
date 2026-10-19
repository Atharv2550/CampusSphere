import express from 'express';
import { getCampusAnalytics, exportAnalyticsCSV } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'faculty', 'resource_manager', 'coordinator'), getCampusAnalytics);
router.get('/export-csv', protect, authorize('admin', 'faculty'), exportAnalyticsCSV);

export default router;
