import express from 'express';
import {
  getListings,
  getListingById,
  createListing,
  toggleBookmark,
  submitRequest,
  updateRequestStatus,
  flagListing,
} from '../controllers/marketplaceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', protect, createListing);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/request', protect, submitRequest);
router.patch('/requests/:requestId', protect, updateRequestStatus);
router.post('/:id/flag', protect, flagListing);

export default router;
