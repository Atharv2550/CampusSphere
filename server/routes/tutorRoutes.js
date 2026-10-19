import express from 'express';
import {
  getTutors,
  getTutorById,
  upsertTutorProfile,
  requestSession,
  getMySessions,
  updateSessionStatus,
  submitReview,
} from '../controllers/tutorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getTutors);
router.get('/my-sessions', protect, getMySessions);
router.get('/:id', getTutorById);
router.post('/profile', protect, upsertTutorProfile);
router.post('/request', protect, requestSession);
router.patch('/sessions/:id', protect, updateSessionStatus);
router.post('/sessions/:sessionId/review', protect, submitReview);

export default router;
