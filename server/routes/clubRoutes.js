import express from 'express';
import {
  getClubs,
  getClubById,
  applyForMembership,
  getClubMembers,
  reviewMembership,
  assignCommitteeRole,
  createClub,
} from '../controllers/clubController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', getClubs);
router.get('/:id', getClubById);
router.post('/', protect, authorize('admin', 'coordinator'), createClub);
router.post('/:id/apply', protect, applyForMembership);
router.get('/:id/members', protect, getClubMembers);
router.patch('/memberships/:membershipId', protect, reviewMembership);
router.post('/:id/assign-role', protect, assignCommitteeRole);

export default router;
