import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  submitClaim,
  reviewClaim,
  flagItem,
} from '../controllers/lostFoundController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', protect, createItem);
router.post('/:id/claim', protect, submitClaim);
router.patch('/claims/:claimId', protect, reviewClaim);
router.post('/:id/flag', protect, flagItem);

export default router;
