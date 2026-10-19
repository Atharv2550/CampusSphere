import express from 'express';
import { getDepartments, createDepartment } from '../controllers/departmentController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', getDepartments);
router.post('/', protect, authorize('admin'), createDepartment);

export default router;
