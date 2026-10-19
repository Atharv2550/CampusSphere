import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { LostFoundItem } from '../models/LostFoundItem.js';
import { MarketplaceListing } from '../models/MarketplaceListing.js';
import { MarketplaceRequest } from '../models/MarketplaceRequest.js';
import { TutoringSession } from '../models/TutoringSession.js';
import { CampusResource } from '../models/CampusResource.js';
import { ResourceBooking } from '../models/ResourceBooking.js';
import { VolunteeringRegistration } from '../models/VolunteeringRegistration.js';
import { Club } from '../models/Club.js';

export const getCampusAnalytics = async (req, res, next) => {
  try {
    // 1. User metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } },
    ]);

    // 2. Event Metrics
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await EventRegistration.countDocuments();
    const attendedRegistrations = await EventRegistration.countDocuments({ status: 'attended' });
    const attendanceRate = totalRegistrations > 0 ? Math.round((attendedRegistrations / totalRegistrations) * 100) : 0;

    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalRegistered: { $sum: '$currentRegisteredCount' } } },
      { $project: { category: '$_id', count: 1, totalRegistered: 1, _id: 0 } },
    ]);

    // 3. Lost & Found Metrics
    const totalLostReports = await LostFoundItem.countDocuments({ type: 'lost' });
    const totalFoundReports = await LostFoundItem.countDocuments({ type: 'found' });
    const resolvedItems = await LostFoundItem.countDocuments({ status: 'Resolved' });
    const lostFoundResolutionRate =
      totalLostReports + totalFoundReports > 0
        ? Math.round((resolvedItems / (totalLostReports + totalFoundReports)) * 100)
        : 0;

    // 4. Marketplace Metrics
    const totalListings = await MarketplaceListing.countDocuments();
    const completedExchanges = await MarketplaceRequest.countDocuments({ status: 'Completed' });

    const listingsByCategory = await MarketplaceListing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    // 5. Tutoring Metrics
    const totalSessions = await TutoringSession.countDocuments();
    const completedSessions = await TutoringSession.countDocuments({ status: 'Completed' });

    // 6. Resource Booking Metrics
    const totalResources = await CampusResource.countDocuments();
    const totalBookings = await ResourceBooking.countDocuments();
    const approvedBookings = await ResourceBooking.countDocuments({ status: 'Approved' });
    const rejectedBookings = await ResourceBooking.countDocuments({ status: 'Rejected' });
    const bookingApprovalRate = totalBookings > 0 ? Math.round((approvedBookings / totalBookings) * 100) : 0;

    // 7. Volunteering Hours
    const volunteerRecords = await VolunteeringRegistration.find({ status: 'attended' });
    const totalVerifiedHours = volunteerRecords.reduce((sum, r) => sum + (r.verifiedHours || 0), 0);

    // 8. Clubs
    const totalClubs = await Club.countDocuments();

    // 9. Activity Trends (Monthly aggregated event registrations)
    const monthlyRegistrations = await EventRegistration.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, _id: 0 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          totalEvents,
          totalRegistrations,
          attendanceRate,
          totalListings,
          completedExchanges,
          lostFoundResolutionRate,
          totalSessions,
          completedSessions,
          totalResources,
          totalBookings,
          bookingApprovalRate,
          totalVerifiedHours,
          totalClubs,
        },
        usersByRole,
        eventsByCategory,
        listingsByCategory,
        monthlyRegistrations,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportAnalyticsCSV = async (req, res, next) => {
  try {
    const events = await Event.find().populate('department', 'name').sort({ startDate: -1 });

    let csv = 'Title,Category,Venue,Start Date,Capacity,Registered,Waitlist,Status\n';
    events.forEach((e) => {
      csv += `"${e.title.replace(/"/g, '""')}","${e.category}","${e.venue.replace(/"/g, '""')}","${new Date(e.startDate).toISOString()}",${e.capacity},${e.currentRegisteredCount},${e.currentWaitlistCount},"${e.status}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`campussphere-events-analytics-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
