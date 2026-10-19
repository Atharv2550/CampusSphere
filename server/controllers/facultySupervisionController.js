import { Club } from '../models/Club.js';
import { Event } from '../models/Event.js';
import { VolunteeringActivity } from '../models/VolunteeringActivity.js';
import { VolunteeringRegistration } from '../models/VolunteeringRegistration.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { AuditLog } from '../models/AuditLog.js';
import { notifyUser } from '../services/notificationService.js';

// GET /api/faculty/supervision
export const getFacultySupervision = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const departmentId = req.user.department;

    // Supervised clubs (either advisor or department clubs)
    const supervisedClubs = await Club.find({
      $or: [{ facultyAdvisor: facultyId }, { department: departmentId }],
      status: 'Active',
    })
      .populate('department', 'name code')
      .populate('coordinators', 'fullName email');

    // Supervised Events
    const supervisedEvents = await Event.find({
      $or: [{ createdBy: facultyId }, { department: departmentId }],
    })
      .populate('department', 'name code')
      .populate('club', 'name')
      .sort({ startDate: -1 });

    // Supervised Volunteering Activities
    const supervisedVolunteering = await VolunteeringActivity.find({
      $or: [{ createdBy: facultyId }, { department: departmentId }],
    })
      .populate('department', 'name code')
      .populate('club', 'name')
      .sort({ date: -1 });

    // Calculate verified student hours supervised
    const activityIds = supervisedVolunteering.map((v) => v._id);
    const verifiedRegistrations = await VolunteeringRegistration.find({
      activity: { $in: activityIds },
      status: 'attended',
    });

    const totalVerifiedHours = verifiedRegistrations.reduce(
      (sum, reg) => sum + (reg.verifiedHours || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        clubs: supervisedClubs,
        events: supervisedEvents,
        volunteering: supervisedVolunteering,
        metrics: {
          clubsCount: supervisedClubs.length,
          eventsCount: supervisedEvents.length,
          volunteeringCount: supervisedVolunteering.length,
          totalVerifiedHours,
          totalParticipants: verifiedRegistrations.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/faculty/approvals
export const getFacultyApprovals = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const departmentId = req.user.department;

    // 1. Pending Volunteering hours to verify
    const myActivities = await VolunteeringActivity.find({
      $or: [{ createdBy: facultyId }, { department: departmentId }],
    }).select('_id title date hours');

    const activityIds = myActivities.map((a) => a._id);

    const pendingVolunteers = await VolunteeringRegistration.find({
      activity: { $in: activityIds },
      status: 'registered',
    })
      .populate('volunteer', 'fullName email studentId department')
      .populate('activity', 'title date hours venue');

    // 2. Pending Event Proposals
    const pendingEvents = await Event.find({
      department: departmentId,
      status: 'Draft',
    })
      .populate('createdBy', 'fullName email role')
      .populate('club', 'name');

    return res.json({
      success: true,
      data: {
        pendingVolunteers,
        pendingEvents,
        totalPending: pendingVolunteers.length + pendingEvents.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/faculty/approvals/volunteering/:id
export const reviewVolunteeringApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, verifiedHours, feedback } = req.body; // action: 'approve' | 'reject'

    const registration = await VolunteeringRegistration.findById(id).populate('activity');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    if (action === 'approve') {
      registration.status = 'attended';
      registration.verifiedHours = verifiedHours || registration.activity?.hours || 2;
      registration.verifiedAt = new Date();
      registration.verifiedBy = req.user._id;
      registration.feedback = feedback || 'Hours verified by faculty supervisor';
      await registration.save();

      await notifyUser(registration.volunteer, {
        title: 'Volunteering Hours Verified',
        message: `Your ${registration.verifiedHours} hours for "${registration.activity?.title}" have been approved and verified!`,
        type: 'volunteering',
        link: '/volunteering/my-records',
      });
    } else {
      registration.status = 'cancelled';
      registration.feedback = feedback || 'Registration rejected by faculty supervisor';
      await registration.save();

      await notifyUser(registration.volunteer, {
        title: 'Volunteering Request Update',
        message: `Your registration for "${registration.activity?.title}" could not be approved.`,
        type: 'volunteering',
        link: '/volunteering',
      });
    }

    await AuditLog.create({
      user: req.user._id,
      action: action === 'approve' ? 'VERIFY_VOLUNTEERING' : 'REJECT_VOLUNTEERING',
      entity: 'VolunteeringRegistration',
      entityId: registration._id,
      details: { action, verifiedHours: registration.verifiedHours },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Volunteering participant ${action === 'approve' ? 'approved & hours verified' : 'rejected'}.`,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/faculty/approvals/events/:id
export const reviewEventApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'publish' | 'reject'

    const event = await Event.findById(id).populate('createdBy', 'fullName email');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (action === 'publish') {
      event.status = 'Published';
      await event.save();

      if (event.createdBy) {
        await notifyUser(event.createdBy._id, {
          title: 'Event Approved & Published',
          message: `Your event "${event.title}" has been approved by faculty supervision and is now published!`,
          type: 'event',
          link: `/events/${event._id}`,
        });
      }
    } else {
      event.status = 'Cancelled';
      await event.save();

      if (event.createdBy) {
        await notifyUser(event.createdBy._id, {
          title: 'Event Proposal Rejected',
          message: `Your event "${event.title}" was not approved by faculty supervision.`,
          type: 'event',
          link: `/events`,
        });
      }
    }

    return res.json({
      success: true,
      message: `Event has been ${action === 'publish' ? 'published' : 'rejected'}.`,
    });
  } catch (error) {
    next(error);
  }
};
