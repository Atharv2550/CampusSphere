import { CampusResource } from '../models/CampusResource.js';
import { ResourceBooking } from '../models/ResourceBooking.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getResources = async (req, res, next) => {
  try {
    const { type, department, isMaintenance, search } = req.query;

    const filter = { isActive: true };
    if (type) filter.type = type;
    if (department) filter.department = department;
    if (isMaintenance !== undefined) filter.isMaintenance = isMaintenance === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const resources = await CampusResource.find(filter)
      .populate('department', 'name code')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: resources,
    });
  } catch (error) {
    next(error);
  }
};

export const getResourceById = async (req, res, next) => {
  try {
    const resource = await CampusResource.findById(req.params.id).populate('department', 'name code');
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Campus resource not found' });
    }

    // Fetch approved bookings for timeline
    const upcomingBookings = await ResourceBooking.find({
      resource: resource._id,
      status: 'Approved',
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })
      .populate('requestedBy', 'fullName email department')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...resource.toObject(),
        upcomingBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createResource = async (req, res, next) => {
  try {
    const { name, type, location, capacity, description, operatingHours, allowedRoles, department, images } = req.body;

    const resource = await CampusResource.create({
      name,
      type,
      location,
      capacity: capacity ? parseInt(capacity, 10) : 1,
      description: description || '',
      operatingHours: operatingHours || { open: '08:00', close: '20:00' },
      allowedRoles: allowedRoles || ['student', 'faculty', 'coordinator', 'resource_manager', 'admin'],
      department: department || null,
      images: Array.isArray(images) ? images : [],
    });

    await logAuditEvent({
      user: req.user,
      action: 'RESOURCE_CREATE',
      targetType: 'CampusResource',
      targetId: resource._id,
      details: { name: resource.name, type: resource.type },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Campus resource registered successfully.',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (req, res, next) => {
  try {
    const resource = await CampusResource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Resource updated.',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

// Conflict detector helper
const checkBookingOverlap = async (resourceId, date, startTime, endTime, excludeBookingId = null) => {
  const query = {
    resource: resourceId,
    date,
    status: 'Approved',
    $or: [
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return ResourceBooking.findOne(query);
};

export const requestBooking = async (req, res, next) => {
  try {
    const { resourceId, purpose, date, startTime, endTime, expectedAttendees } = req.body;

    if (!resourceId || !purpose || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resource, purpose, date, start time, and end time.',
      });
    }

    const resource = await CampusResource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (resource.isMaintenance) {
      return res.status(400).json({
        success: false,
        message: `Resource is currently under maintenance: ${resource.maintenanceNotes || 'Unavailable for booking.'}`,
      });
    }

    // Role eligibility check
    if (!resource.allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Your role (${req.user.role}) is not authorized to reserve this resource.`,
      });
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book resources in the past.',
      });
    }

    // Operating hours check
    if (resource.operatingHours) {
      if (startTime < resource.operatingHours.open || endTime > resource.operatingHours.close) {
        return res.status(400).json({
          success: false,
          message: `Booking must be within operating hours (${resource.operatingHours.open} - ${resource.operatingHours.close}).`,
        });
      }
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.',
      });
    }

    // Check for approved conflicts
    const conflict = await checkBookingOverlap(resource._id, bookingDate, startTime, endTime);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Conflict detected: Another approved reservation exists for this resource from ${conflict.startTime} to ${conflict.endTime}.`,
      });
    }

    const booking = await ResourceBooking.create({
      resource: resource._id,
      requestedBy: req.user._id,
      purpose,
      date: bookingDate,
      startTime,
      endTime,
      expectedAttendees: expectedAttendees ? parseInt(expectedAttendees, 10) : 1,
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Booking request submitted! Awaiting resource manager approval.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { status, resourceId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (resourceId) filter.resource = resourceId;

    // Normal students only see their own bookings unless resource manager or admin
    if (req.user.role !== 'admin' && req.user.role !== 'resource_manager') {
      filter.requestedBy = req.user._id;
    }

    const bookings = await ResourceBooking.find(filter)
      .populate('resource', 'name type location operatingHours capacity')
      .populate('requestedBy', 'fullName email department avatar role studentId')
      .sort({ date: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewBooking = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body; // 'Approved' or 'Rejected'
    const booking = await ResourceBooking.findById(req.params.bookingId).populate('resource');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found' });
    }

    // Atomic server-side anti-overlap check before approving
    if (status === 'Approved') {
      const conflict = await checkBookingOverlap(
        booking.resource._id,
        booking.date,
        booking.startTime,
        booking.endTime,
        booking._id
      );

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Cannot approve: An overlapping reservation was already approved between ${conflict.startTime} and ${conflict.endTime}.`,
        });
      }
    }

    booking.status = status;
    booking.reviewedBy = req.user._id;
    booking.reviewNotes = reviewNotes || '';
    await booking.save();

    await createNotification({
      recipient: booking.requestedBy,
      title: status === 'Approved' ? '✅ Resource Booking Approved!' : '❌ Resource Booking Rejected',
      message:
        status === 'Approved'
          ? `Your reservation for "${booking.resource.name}" on ${new Date(booking.date).toDateString()} (${booking.startTime}-${booking.endTime}) was approved.`
          : `Your reservation request for "${booking.resource.name}" was not approved: ${reviewNotes || 'Scheduling conflict or resource unavailability.'}`,
      type: 'booking',
      relatedId: booking._id,
      actionUrl: '/bookings',
    });

    res.status(200).json({
      success: true,
      message: `Booking has been ${status.toLowerCase()} successfully.`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await ResourceBooking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'resource_manager' &&
      booking.requestedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};
