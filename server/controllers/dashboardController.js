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
import { VolunteeringActivity } from '../models/VolunteeringActivity.js';
import { Club } from '../models/Club.js';
import { TimetableEntry } from '../models/TimetableEntry.js';
import { DutyAssignment } from '../models/DutyAssignment.js';
import { LectureAttendance } from '../models/LectureAttendance.js';
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

export const getFacultyDashboard = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const departmentId = req.user.department;

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = days[now.getDay()];

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Regular timetable entries for today
    const todayRegularLectures = await TimetableEntry.find({
      faculty: facultyId,
      dayOfWeek: todayDayName,
      status: 'Published',
    })
      .populate('subject', 'name code semester')
      .populate('classDivision', 'name code studentCount')
      .populate('department', 'name code')
      .sort({ startTime: 1 });

    // 2. Duties / substitutions assigned for today
    const todayDuties = await DutyAssignment.find({
      faculty: facultyId,
      date: { $gte: startOfToday, $lte: endOfToday },
      status: { $in: ['Assigned', 'Acknowledged'] },
    })
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .populate('originalFaculty', 'fullName email')
      .sort({ startTime: 1 });

    // 3. Merge into unified chronological today's schedule
    const todaySchedule = [
      ...todayRegularLectures.map((l) => ({
        _id: l._id,
        itemType: 'Lecture',
        title: l.subject?.name || 'Academic Lecture',
        code: l.subject?.code,
        classDivision: l.classDivision?.name,
        room: l.room,
        startTime: l.startTime,
        endTime: l.endTime,
        activityType: l.activityType,
        isCompleted: l.endTime <= currentTimeStr,
        isCurrent: l.startTime <= currentTimeStr && l.endTime > currentTimeStr,
      })),
      ...todayDuties.map((d) => ({
        _id: d._id,
        itemType: d.type === 'Substitution' ? 'Substitution' : 'Duty',
        title: d.title,
        code: d.subject?.code,
        classDivision: d.classDivision?.name,
        room: d.room || 'Campus',
        startTime: d.startTime,
        endTime: d.endTime,
        activityType: d.type,
        isCompleted: d.endTime <= currentTimeStr,
        isCurrent: d.startTime <= currentTimeStr && d.endTime > currentTimeStr,
        dutyStatus: d.status,
      })),
    ].sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Next lecture / duty
    const remainingItems = todaySchedule.filter((item) => item.endTime > currentTimeStr);
    const nextItem = remainingItems.length > 0 ? remainingItems[0] : null;

    // 4. Weekly teaching sessions
    const weeklyTeachingCount = await TimetableEntry.countDocuments({
      faculty: facultyId,
      status: 'Published',
    });

    // 5. Upcoming duties across the next 30 days
    const upcomingDuties = await DutyAssignment.find({
      faculty: facultyId,
      date: { $gte: startOfToday },
      status: { $in: ['Assigned', 'Acknowledged'] },
    })
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .sort({ date: 1, startTime: 1 })
      .limit(6);

    // 6. Supervised activities
    const supervisedClubs = await Club.find({
      $or: [{ facultyAdvisor: facultyId }, { department: departmentId }],
      status: 'Active',
    }).select('name category description memberCount');

    const supervisedEvents = await Event.find({
      $or: [{ createdBy: facultyId }, { department: departmentId }],
    })
      .sort({ startDate: -1 })
      .limit(5);

    const supervisedVolunteering = await VolunteeringActivity.find({
      $or: [{ createdBy: facultyId }, { department: departmentId }],
    })
      .sort({ date: -1 })
      .limit(5);

    // 7. Pending approvals
    const myActivityIds = supervisedVolunteering.map((v) => v._id);
    const pendingVolunteersCount = await VolunteeringRegistration.countDocuments({
      activity: { $in: myActivityIds },
      status: 'registered',
    });

    const pendingEventsCount = await Event.countDocuments({
      department: departmentId,
      status: 'Draft',
    });

    const totalPendingApprovals = pendingVolunteersCount + pendingEventsCount;

    // 8. Department announcements
    const announcements = await Announcement.find({
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'faculty' },
        { department: departmentId },
      ],
      isPublished: true,
    })
      .sort({ isPinned: -1, publishedAt: -1 })
      .limit(5);

    // 9. Unread notifications
    const unreadNotifications = await Notification.countDocuments({
      recipient: facultyId,
      isRead: false,
    });

    // 10. Recent attendance records
    const recentAttendance = await LectureAttendance.find({ faculty: facultyId })
      .populate('subject', 'name code')
      .populate('classDivision', 'name')
      .sort({ date: -1 })
      .limit(4);

    return res.status(200).json({
      success: true,
      data: {
        todayDayName,
        todayLecturesCount: todayRegularLectures.length,
        remainingLecturesToday: remainingItems.length,
        nextItem,
        weeklyTeachingCount,
        upcomingDutiesCount: upcomingDuties.length,
        totalPendingApprovals,
        supervisedEventsCount: supervisedEvents.length,
        supervisedVolunteeringCount: supervisedVolunteering.length,
        todaySchedule,
        upcomingDuties,
        supervisedClubs,
        supervisedEvents,
        supervisedVolunteering,
        announcements,
        unreadNotifications,
        recentAttendance,
      },
    });
  } catch (error) {
    next(error);
  }
};

