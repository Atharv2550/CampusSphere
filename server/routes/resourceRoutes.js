import express from 'express';
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  requestBooking,
  getBookings,
  reviewBooking,
  cancelBooking,
} from '../controllers/resourceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', getResources);
router.get('/bookings', protect, getBookings);
router.get('/:id', getResourceById);
router.post('/', protect, authorize('admin', 'resource_manager'), createResource);
router.put('/:id', protect, authorize('admin', 'resource_manager'), updateResource);
router.post('/book', protect, requestBooking);
router.patch('/bookings/:bookingId/review', protect, authorize('admin', 'resource_manager'), reviewBooking);
router.patch('/bookings/:bookingId/cancel', protect, cancelBooking);

export default router;
