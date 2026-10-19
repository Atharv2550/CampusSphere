import { Club } from '../models/Club.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Event } from '../models/Event.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getClubs = async (req, res, next) => {
  try {
    const { category, department, search, page = 1, limit = 12 } = req.query;

    const filter = { status: 'Active' };
    if (category) filter.category = category;
    if (department) filter.department = department;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Club.countDocuments(filter);
    const clubs = await Club.find(filter)
      .populate('department', 'name code')
      .populate('coordinators', 'fullName email avatar')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: clubs,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('department', 'name code')
      .populate('coordinators', 'fullName email avatar department')
      .populate('committeeMembers.user', 'fullName email avatar department');

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    // Check membership of logged-in user
    let userMembership = null;
    if (req.user) {
      userMembership = await ClubMembership.findOne({
        club: club._id,
        user: req.user._id,
      });
    }

    // Fetch club's upcoming events
    const upcomingEvents = await Event.find({
      club: club._id,
      status: { $in: ['Published', 'Full'] },
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(4);

    const memberCount = await ClubMembership.countDocuments({
      club: club._id,
      status: 'approved',
    });

    res.status(200).json({
      success: true,
      data: {
        ...club.toObject(),
        userMembership,
        upcomingEvents,
        memberCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const applyForMembership = async (req, res, next) => {
  try {
    const { applicationReason } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    if (club.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This club is currently not accepting members.' });
    }

    const existingMembership = await ClubMembership.findOne({
      club: club._id,
      user: req.user._id,
    });

    if (existingMembership) {
      if (existingMembership.status === 'approved') {
        return res.status(400).json({ success: false, message: 'You are already an approved member of this club.' });
      }
      if (existingMembership.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Your membership application is already pending review.' });
      }
      // Re-apply if rejected or cancelled
      existingMembership.status = 'pending';
      existingMembership.applicationReason = applicationReason || '';
      await existingMembership.save();

      return res.status(200).json({
        success: true,
        message: 'Membership application submitted for review.',
        data: existingMembership,
      });
    }

    const membership = await ClubMembership.create({
      club: club._id,
      user: req.user._id,
      applicationReason: applicationReason || '',
      status: 'pending',
    });

    // Notify club coordinators
    for (const coordId of club.coordinators) {
      await createNotification({
        recipient: coordId,
        title: '👥 New Club Membership Application',
        message: `${req.user.fullName} applied to join ${club.name}. Review their application in coordinator dashboard.`,
        type: 'club',
        relatedId: club._id,
        actionUrl: `/clubs/${club._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Membership application submitted successfully.',
      data: membership,
    });
  } catch (error) {
    next(error);
  }
};

export const getClubMembers = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const isCoordinator =
      req.user &&
      (req.user.role === 'admin' ||
        club.coordinators.some((c) => c.toString() === req.user._id.toString()));

    if (!isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only coordinators and administrators can view full applications.',
      });
    }

    const members = await ClubMembership.find({ club: club._id })
      .populate('user', 'fullName email department academicYear avatar studentId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewMembership = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body; // 'approved' or 'rejected'
    const membership = await ClubMembership.findById(req.params.membershipId).populate('club');

    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership record not found' });
    }

    const club = await Club.findById(membership.club._id);
    const isCoordinator =
      req.user.role === 'admin' || club.coordinators.some((c) => c.toString() === req.user._id.toString());

    if (!isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to review applications for this club.',
      });
    }

    membership.status = status;
    membership.reviewedBy = req.user._id;
    membership.reviewNotes = reviewNotes || '';
    await membership.save();

    await createNotification({
      recipient: membership.user,
      title: status === 'approved' ? `🎉 Welcome to ${club.name}!` : `Membership Update: ${club.name}`,
      message:
        status === 'approved'
          ? `Your membership application for ${club.name} has been approved! Explore club activities now.`
          : `Your membership application for ${club.name} was not approved: ${reviewNotes || 'Capacity reached.'}`,
      type: 'club',
      relatedId: club._id,
      actionUrl: `/clubs/${club._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Membership status updated to ${status}.`,
      data: membership,
    });
  } catch (error) {
    next(error);
  }
};

export const assignCommitteeRole = async (req, res, next) => {
  try {
    const { userId, roleTitle } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const isCoordinator =
      req.user.role === 'admin' || club.coordinators.some((c) => c.toString() === req.user._id.toString());

    if (!isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only club coordinators or admins can assign committee roles.',
      });
    }

    // Check if membership is approved
    const membership = await ClubMembership.findOne({
      club: club._id,
      user: userId,
      status: 'approved',
    });

    if (!membership) {
      return res.status(400).json({
        success: false,
        message: 'User must be an approved club member before assigning a committee role.',
      });
    }

    // Update or add committee role in Club model
    const existingIndex = club.committeeMembers.findIndex((m) => m.user.toString() === userId.toString());
    if (existingIndex > -1) {
      club.committeeMembers[existingIndex].roleTitle = roleTitle;
    } else {
      club.committeeMembers.push({ user: userId, roleTitle });
    }

    membership.role = 'committee';
    await membership.save();
    await club.save();

    await createNotification({
      recipient: userId,
      title: `⭐ New Role Assigned in ${club.name}`,
      message: `Congratulations! You have been appointed as "${roleTitle}" for ${club.name}.`,
      type: 'club',
      relatedId: club._id,
      actionUrl: `/clubs/${club._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Assigned "${roleTitle}" role to member successfully.`,
      data: club,
    });
  } catch (error) {
    next(error);
  }
};

export const createClub = async (req, res, next) => {
  try {
    const { name, code, description, category, department, meetingInfo, logo, banner, coordinatorEmail } = req.body;

    const club = await Club.create({
      name,
      code,
      description,
      category,
      department: department || null,
      meetingInfo: meetingInfo || '',
      logo: logo || '',
      banner: banner || '',
      coordinators: [req.user._id],
    });

    res.status(201).json({
      success: true,
      message: 'Club created successfully.',
      data: club,
    });
  } catch (error) {
    next(error);
  }
};
