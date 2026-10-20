import express from 'express';
import {
  getUsers,
  updateUserStatus,
  getFlaggedContent,
  moderateContent,
  getAuditLogs,
  getPlatformSettings,
  updatePlatformSetting,
  createFaculty,
  updateFaculty,
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Enforce admin-only access
router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.patch('/users/:id', updateUserStatus);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.get('/flagged', getFlaggedContent);
router.post('/moderate', moderateContent);
router.get('/audit-logs', getAuditLogs);
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSetting);

export default router;
