import { VolunteeringActivity } from '../models/VolunteeringActivity.js';
import { VolunteeringRegistration } from '../models/VolunteeringRegistration.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getActivities = async (req, res, next) => {
  try {
    const { category, department, status, search, page = 1, limit = 12 } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['Open', 'Full', 'Completed'] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await VolunteeringActivity.countDocuments(filter);
    const activities = await VolunteeringActivity.find(filter)
      .populate('organizer', 'fullName email avatar')
      .populate('department', 'name code')
      .populate('club', 'name code')
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: activities,
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

export const getActivityById = async (req, res, next) => {
  try {
    const activity = await VolunteeringActivity.findById(req.params.id)
      .populate('organizer', 'fullName email avatar department')
      .populate('department', 'name code')
      .populate('club', 'name code');

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Volunteering activity not found' });
    }

    let userRegistration = null;
    if (req.user) {
      userRegistration = await VolunteeringRegistration.findOne({
        activity: activity._id,
        volunteer: req.user._id,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...activity.toObject(),
        userRegistration,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req, res, next) => {
  try {
    const { title, description, department, club, venue, date, startTime, endTime, allocatedHours, requiredSkills, capacity, banner } = req.body;

    const activity = await VolunteeringActivity.create({
      title,
      description,
      organizer: req.user._id,
      department: department || null,
      club: club || null,
      venue,
      date,
      startTime,
      endTime,
      allocatedHours: parseFloat(allocatedHours) || 2,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      capacity: parseInt(capacity, 10) || 20,
      banner: banner || '',
    });

    await logAuditEvent({
      user: req.user,
      action: 'VOLUNTEERING_CREATE',
      targetType: 'VolunteeringActivity',
      targetId: activity._id,
      details: { title: activity.title, allocatedHours: activity.allocatedHours },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Volunteering opportunity published successfully.',
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

export const registerForActivity = async (req, res, next) => {
  try {
    const activity = await VolunteeringActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    if (activity.status !== 'Open') {
      return res.status(400).json({ success: false, message: `Cannot register: Activity is ${activity.status.toLowerCase()}.` });
    }

    const existingReg = await VolunteeringRegistration.findOne({
      activity: activity._id,
      volunteer: req.user._id,
    });

    if (existingReg && existingReg.status === 'registered') {
      return res.status(400).json({ success: false, message: 'You are already registered for this activity.' });
    }

    if (activity.currentRegisteredCount >= activity.capacity) {
      activity.status = 'Full';
      await activity.save();
      return res.status(400).json({ success: false, message: 'Volunteering opportunity is currently full.' });
    }

    activity.currentRegisteredCount += 1;
    if (activity.currentRegisteredCount >= activity.capacity) {
      activity.status = 'Full';
    }
    await activity.save();

    let registration;
    if (existingReg) {
      existingReg.status = 'registered';
      await existingReg.save();
      registration = existingReg;
    } else {
      registration = await VolunteeringRegistration.create({
        activity: activity._id,
        volunteer: req.user._id,
        status: 'registered',
      });
    }

    await createNotification({
      recipient: req.user._id,
      title: '🤝 Volunteering Registration Confirmed',
      message: `You are registered for "${activity.title}". Venue: ${activity.venue} on ${new Date(activity.date).toDateString()}. Thank you for your service!`,
      type: 'volunteering',
      relatedId: activity._id,
      actionUrl: `/volunteering/${activity._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Registered for volunteering activity successfully.',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

export const getActivityVolunteers = async (req, res, next) => {
  try {
    const activity = await VolunteeringActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const isAuthorized =
      req.user.role === 'admin' ||
      activity.organizer.toString() === req.user._id.toString() ||
      req.user.role === 'faculty';

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const volunteers = await VolunteeringRegistration.find({ activity: activity._id })
      .populate('volunteer', 'fullName email department studentId avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: volunteers,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyParticipation = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const { status, verifiedHours, verificationNotes } = req.body;

    const registration = await VolunteeringRegistration.findById(registrationId).populate('activity');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }

    const activity = await VolunteeringActivity.findById(registration.activity._id);
    const isAuthorized =
      req.user.role === 'admin' || activity.organizer.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied: Only organizers or admins can verify participation.' });
    }

    registration.status = status || 'attended';
    const hours = verifiedHours !== undefined ? parseFloat(verifiedHours) : activity.allocatedHours;
    registration.verifiedHours = hours;
    registration.verifiedBy = req.user._id;
    registration.verificationNotes = verificationNotes || '';

    if (registration.status === 'attended' && hours > 0) {
      registration.certificateIssued = true;
      registration.issuedAt = new Date();
      registration.certificateCode = `CS-VOL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    await registration.save();

    await createNotification({
      recipient: registration.volunteer,
      title: '🎖️ Volunteering Hours Verified!',
      message: `Congratulations! ${hours} hours of community service have been verified for "${activity.title}". Your participation certificate is ready.`,
      type: 'volunteering',
      relatedId: activity._id,
      actionUrl: '/volunteering/my-records',
    });

    res.status(200).json({
      success: true,
      message: 'Participation verified and certificate issued.',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyVolunteeringRecords = async (req, res, next) => {
  try {
    const records = await VolunteeringRegistration.find({ volunteer: req.user._id })
      .populate({
        path: 'activity',
        populate: [{ path: 'department' }, { path: 'club' }],
      })
      .sort({ createdAt: -1 });

    const totalVerifiedHours = records.reduce((sum, r) => sum + (r.verifiedHours || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        records,
        totalVerifiedHours,
      },
    });
  } catch (error) {
    next(error);
  }
};
