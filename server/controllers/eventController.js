import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getEvents = async (req, res, next) => {
  try {
    const { category, department, club, status, search, timeFilter, sort = 'startDate', page = 1, limit = 12 } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (department) filter.department = department;
    if (club) filter.club = club;

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['Published', 'Full', 'Completed'] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    const now = new Date();
    if (timeFilter === 'upcoming') {
      filter.startDate = { $gte: now };
    } else if (timeFilter === 'past') {
      filter.startDate = { $lt: now };
    }

    const sortOption = {};
    if (sort === 'popularity') {
      sortOption.currentRegisteredCount = -1;
    } else if (sort === 'newest') {
      sortOption.createdAt = -1;
    } else {
      sortOption.startDate = 1;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate('organizer', 'fullName email avatar')
      .populate('department', 'name code')
      .populate('club', 'name code logo')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: events,
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

export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'fullName email avatar role')
      .populate('department', 'name code')
      .populate('club', 'name code logo');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check user registration if logged in
    let userRegistration = null;
    if (req.user) {
      userRegistration = await EventRegistration.findOne({
        event: event._id,
        user: req.user._id,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...event.toObject(),
        userRegistration,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      department,
      club,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      capacity,
      waitlistCapacity = 50,
      banner,
      tags,
    } = req.body;

    if (!title || !description || !venue || !startDate || !endDate || !registrationDeadline || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields including title, venue, dates, and capacity.',
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after the start date.',
      });
    }

    const event = await Event.create({
      title,
      description,
      category,
      organizer: req.user._id,
      department: department || req.user.department || null,
      club: club || req.user.assignedClub || null,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      capacity: parseInt(capacity, 10),
      waitlistCapacity: parseInt(waitlistCapacity, 10),
      banner: banner || '',
      tags: Array.isArray(tags) ? tags : [],
      status: 'Published',
    });

    await logAuditEvent({
      user: req.user,
      action: 'EVENT_CREATE',
      targetType: 'Event',
      targetId: event._id,
      details: { title: event.title, capacity: event.capacity },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Event created and published successfully.',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only event organizer or campus admin can edit this event.',
      });
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (['Cancelled', 'Archived', 'Completed'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot register: Event is currently ${event.status.toLowerCase()}.`,
      });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed for this event.',
      });
    }

    const existingReg = await EventRegistration.findOne({
      event: event._id,
      user: req.user._id,
    });

    if (existingReg) {
      if (['registered', 'waitlisted', 'attended'].includes(existingReg.status)) {
        return res.status(400).json({
          success: false,
          message: `You are already ${existingReg.status} for this event.`,
        });
      }
      // If previously cancelled, we allow re-registering
    }

    // Atomic capacity check
    let registrationStatus = 'registered';
    let waitlistPos = 0;

    if (event.currentRegisteredCount < event.capacity) {
      event.currentRegisteredCount += 1;
      if (event.currentRegisteredCount >= event.capacity) {
        event.status = 'Full';
      }
    } else if (event.currentWaitlistCount < event.waitlistCapacity) {
      registrationStatus = 'waitlisted';
      event.currentWaitlistCount += 1;
      waitlistPos = event.currentWaitlistCount;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Event capacity and waitlist are completely full.',
      });
    }

    await event.save();

    let registration;
    if (existingReg) {
      existingReg.status = registrationStatus;
      existingReg.waitlistPosition = waitlistPos;
      await existingReg.save();
      registration = existingReg;
    } else {
      registration = await EventRegistration.create({
        event: event._id,
        user: req.user._id,
        status: registrationStatus,
        waitlistPosition: waitlistPos,
      });
    }

    // Trigger in-app notification
    await createNotification({
      recipient: req.user._id,
      title: registrationStatus === 'registered' ? 'Event Registration Confirmed!' : 'Added to Event Waitlist',
      message:
        registrationStatus === 'registered'
          ? `You have secured a seat for "${event.title}". Venue: ${event.venue}. Check-in code: ${event.checkInCode}`
          : `You are #${waitlistPos} on the waitlist for "${event.title}". You will be automatically enrolled if a seat opens up!`,
      type: registrationStatus === 'registered' ? 'event' : 'waitlist',
      relatedId: event._id,
      actionUrl: `/events/${event._id}`,
    });

    res.status(200).json({
      success: true,
      message:
        registrationStatus === 'registered'
          ? 'Successfully registered for event!'
          : `Added to waitlist at position #${waitlistPos}.`,
      data: {
        registration,
        eventStatus: event.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await EventRegistration.findOne({
      event: req.params.id,
      user: req.user._id,
      status: { $in: ['registered', 'waitlisted'] },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No active registration or waitlist entry found to cancel.',
      });
    }

    const wasRegistered = registration.status === 'registered';
    registration.status = 'cancelled';
    await registration.save();

    const event = await Event.findById(req.params.id);
    if (event) {
      if (wasRegistered) {
        event.currentRegisteredCount = Math.max(0, event.currentRegisteredCount - 1);

        // Check if there are waitlisted participants to promote!
        const nextWaitlisted = await EventRegistration.findOne({
          event: event._id,
          status: 'waitlisted',
        }).sort({ waitlistPosition: 1 });

        if (nextWaitlisted) {
          nextWaitlisted.status = 'registered';
          nextWaitlisted.waitlistPosition = 0;
          await nextWaitlisted.save();

          event.currentRegisteredCount += 1;
          event.currentWaitlistCount = Math.max(0, event.currentWaitlistCount - 1);

          await createNotification({
            recipient: nextWaitlisted.user,
            title: '🎉 Promoted from Waitlist!',
            message: `A seat opened up! You are now confirmed for "${event.title}". Check-in code: ${event.checkInCode}`,
            type: 'waitlist',
            relatedId: event._id,
            actionUrl: `/events/${event._id}`,
          });
        }

        if (event.status === 'Full' && event.currentRegisteredCount < event.capacity) {
          event.status = 'Published';
        }
      } else {
        event.currentWaitlistCount = Math.max(0, event.currentWaitlistCount - 1);
      }
      await event.save();
    }

    res.status(200).json({
      success: true,
      message: 'Registration successfully cancelled.',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventAttendees = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only organizer, faculty, coordinator, or admin can view participant roster
    if (
      req.user.role !== 'admin' &&
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'faculty'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only organizers and administrators can view attendees.',
      });
    }

    const attendees = await EventRegistration.find({ event: event._id })
      .populate('user', 'fullName email department studentId avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: attendees,
      checkInCode: event.checkInCode,
    });
  } catch (error) {
    next(error);
  }
};

export const checkInAttendee = async (req, res, next) => {
  try {
    const { code, userId } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Student self-checkin via code OR organizer marking by userId
    let targetUserId = req.user._id;
    if (userId && (req.user.role === 'admin' || event.organizer.toString() === req.user._id.toString())) {
      targetUserId = userId;
    } else {
      if (!code || code.trim().toUpperCase() !== event.checkInCode.toUpperCase()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event check-in code.',
        });
      }
    }

    const registration = await EventRegistration.findOne({
      event: event._id,
      user: targetUserId,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No registration record found for this participant.',
      });
    }

    if (registration.status === 'attended') {
      return res.status(400).json({
        success: false,
        message: 'Participant is already checked in.',
      });
    }

    registration.status = 'attended';
    registration.checkInTime = new Date();
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Attendance verified and marked successfully!',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};
