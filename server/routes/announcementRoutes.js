import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', protect, authorize('admin', 'faculty', 'coordinator'), createAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);

export default router;
