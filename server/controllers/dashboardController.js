import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { LostFoundItem } from '../models/LostFoundItem.js';
import { MarketplaceListing } from '../models/MarketplaceListing.js';
import { MarketplaceRequest } from '../models/MarketplaceRequest.js';
import { TutoringSession } from '../models/TutoringSession.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { ResourceBooking } from '../models/ResourceBooking.js';
import { VolunteeringRegistration } from '../models/VolunteeringRegistration.js';
import { findPotentialMatches } from '../services/matchingService.js';

export const getStudentDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Upcoming registered events
    const myRegistrations = await EventRegistration.find({
      user: userId,
      status: { $in: ['registered', 'waitlisted'] },
    }).populate({
      path: 'event',
      populate: [{ path: 'department' }, { path: 'club' }],
    });

    const upcomingRegisteredEvents = myRegistrations
      .filter((r) => r.event && new Date(r.event.startDate) >= new Date())
      .map((r) => ({
        ...r.event.toObject(),
        registrationStatus: r.status,
        waitlistPosition: r.waitlistPosition,
        checkInCode: r.event.checkInCode,
      }))
      .slice(0, 5);

    // 2. Recommended events based on interests
    let recommendedEvents = [];
    if (req.user.interests && req.user.interests.length > 0) {
      recommendedEvents = await Event.find({
        status: 'Published',
        startDate: { $gte: new Date() },
        $or: [
          { tags: { $in: req.user.interests } },
          { category: { $in: req.user.interests } },
        ],
      })
        .limit(4)
        .populate('department')
        .populate('club');
    }

    if (recommendedEvents.length === 0) {
      recommendedEvents = await Event.find({
        status: 'Published',
        startDate: { $gte: new Date() },
      })
        .sort({ currentRegisteredCount: -1 })
        .limit(4)
        .populate('department')
        .populate('club');
    }

    // 3. Recent Announcements
    const announcements = await Announcement.find({
      $or: [
        { targetAudience: 'All' },
        { targetAudience: 'Role', targetRole: req.user.role },
        { targetAudience: 'Department', targetDepartment: req.user.department },
      ],
    })
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(5);

    // 4. Lost & Found reports by this user and possible matches
    const myLostReports = await LostFoundItem.find({ reporter: userId }).sort({ createdAt: -1 }).limit(3);
    const possibleMatches = [];
    for (const item of myLostReports) {
      const matches = await findPotentialMatches(item, 2);
      if (matches.length > 0) {
        possibleMatches.push({ itemTitle: item.title, matches });
      }
    }

    // 5. Active marketplace listings and requests
    const myListings = await MarketplaceListing.find({ seller: userId, status: { $in: ['Available', 'Reserved'] } }).limit(4);
    const myRequests = await MarketplaceRequest.find({ buyer: userId, status: { $in: ['Pending', 'Accepted'] } })
      .populate('listing')
      .limit(4);

    // 6. Upcoming tutoring sessions
    const upcomingSessions = await TutoringSession.find({
      $or: [{ tutor: userId }, { student: userId }],
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      status: { $in: ['Requested', 'Accepted'] },
    })
      .populate('tutor', 'fullName email avatar')
      .populate('student', 'fullName email avatar')
      .sort({ date: 1, startTime: 1 })
      .limit(4);

    // 7. Club memberships
    const clubMemberships = await ClubMembership.find({ user: userId, status: 'approved' })
      .populate('club', 'name code logo category')
      .limit(6);

    // 8. Upcoming volunteering
    const volunteeringRegs = await VolunteeringRegistration.find({
      volunteer: userId,
      status: 'registered',
    })
      .populate('activity')
      .limit(3);

    // 9. Resource bookings
    const myBookings = await ResourceBooking.find({ requestedBy: userId })
      .populate('resource', 'name type location')
      .sort({ createdAt: -1 })
      .limit(4);

    // 10. Unread notification count
    const unreadNotifications = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        upcomingRegisteredEvents,
        recommendedEvents,
        announcements,
        myLostReports,
        possibleMatches,
        myListings,
        myRequests,
        upcomingSessions,
        clubMemberships,
        volunteeringRegs,
        myBookings,
        unreadNotifications,
      },
    });
  } catch (error) {
    next(error);
  }
};
