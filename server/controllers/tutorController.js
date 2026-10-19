import { TutorProfile } from '../models/TutorProfile.js';
import { TutoringSession } from '../models/TutoringSession.js';
import { TutoringReview } from '../models/TutoringReview.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getTutors = async (req, res, next) => {
  try {
    const { subject, department, minRating, search, page = 1, limit = 12 } = req.query;

    const filter = { isActive: true };
    if (subject) filter.subjects = { $regex: subject, $options: 'i' };
    if (department) filter.department = department;
    if (minRating) filter.ratingAverage = { $gte: parseFloat(minRating) };

    if (search) {
      filter.$or = [
        { subjects: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { experience: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await TutorProfile.countDocuments(filter);
    const tutors = await TutorProfile.find(filter)
      .populate('user', 'fullName email avatar department academicYear')
      .populate('department', 'name code')
      .sort({ ratingAverage: -1, ratingCount: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: tutors,
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

export const getTutorById = async (req, res, next) => {
  try {
    const tutor = await TutorProfile.findById(req.params.id)
      .populate('user', 'fullName email avatar department studentId bio')
      .populate('department', 'name code');

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found' });
    }

    // Fetch verified reviews
    const reviews = await TutoringReview.find({ tutor: tutor.user._id })
      .populate('student', 'fullName avatar department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...tutor.toObject(),
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const upsertTutorProfile = async (req, res, next) => {
  try {
    const { subjects, bio, experience, department, meetingModes, availableSlots } = req.body;

    if (!subjects || subjects.length === 0 || !bio) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one subject and a bio for your tutor profile.',
      });
    }

    let profile = await TutorProfile.findOne({ user: req.user._id });

    if (profile) {
      profile.subjects = subjects;
      profile.bio = bio;
      profile.experience = experience || '';
      profile.department = department || req.user.department || null;
      if (meetingModes) profile.meetingModes = meetingModes;
      if (availableSlots) profile.availableSlots = availableSlots;
      profile.isActive = true;
      await profile.save();
    } else {
      profile = await TutorProfile.create({
        user: req.user._id,
        subjects,
        bio,
        experience: experience || '',
        department: department || req.user.department || null,
        meetingModes: meetingModes || ['In-person', 'Online'],
        availableSlots: availableSlots || [],
      });
    }

    await logAuditEvent({
      user: req.user,
      action: 'TUTOR_PROFILE_UPSERT',
      targetType: 'TutorProfile',
      targetId: profile._id,
      details: { subjects },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Tutor profile saved successfully.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const requestSession = async (req, res, next) => {
  try {
    const { tutorUserId, subject, date, startTime, endTime, meetingMode, locationOrLink, notes } = req.body;

    if (!tutorUserId || !subject || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide tutor, subject, date, start time, and end time.',
      });
    }

    if (tutorUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book a tutoring session with yourself.',
      });
    }

    const sessionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sessionDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule tutoring sessions in the past.',
      });
    }

    // Check conflict: tutor already booked at the same date and time
    const conflict = await TutoringSession.findOne({
      tutor: tutorUserId,
      date: sessionDate,
      status: { $in: ['Requested', 'Accepted'] },
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'The tutor is already scheduled for another session during this time slot.',
      });
    }

    const session = await TutoringSession.create({
      tutor: tutorUserId,
      student: req.user._id,
      subject,
      date: sessionDate,
      startTime,
      endTime,
      meetingMode: meetingMode || 'In-person',
      locationOrLink: locationOrLink || 'Campus Library Study Cubicle',
      notes: notes || '',
      status: 'Requested',
    });

    await createNotification({
      recipient: tutorUserId,
      title: '🎓 New Tutoring Request',
      message: `${req.user.fullName} requested a session in "${subject}" on ${sessionDate.toDateString()} from ${startTime} to ${endTime}.`,
      type: 'tutoring',
      relatedId: session._id,
      actionUrl: '/tutoring',
    });

    res.status(201).json({
      success: true,
      message: 'Tutoring session requested! The tutor has been notified.',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

export const getMySessions = async (req, res, next) => {
  try {
    const sessions = await TutoringSession.find({
      $or: [{ tutor: req.user._id }, { student: req.user._id }],
    })
      .populate('tutor', 'fullName email avatar department')
      .populate('student', 'fullName email avatar department')
      .sort({ date: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSessionStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    const session = await TutoringSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const isTutor = session.tutor.toString() === req.user._id.toString();
    const isStudent = session.student.toString() === req.user._id.toString();

    if (!isTutor && !isStudent && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (status === 'Accepted' && !isTutor && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the tutor can accept requests.' });
    }

    session.status = status;
    if (cancellationReason) session.cancellationReason = cancellationReason;
    await session.save();

    const notifyRecipient = isTutor ? session.student : session.tutor;
    await createNotification({
      recipient: notifyRecipient,
      title: `Tutoring Session ${status}`,
      message: `Your tutoring session for "${session.subject}" is now marked as ${status}.`,
      type: 'tutoring',
      relatedId: session._id,
      actionUrl: '/tutoring',
    });

    res.status(200).json({
      success: true,
      message: `Session status updated to ${status}.`,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

export const submitReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const session = await TutoringSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the student who attended this completed session can submit a review.',
      });
    }

    if (session.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted after the tutoring session is marked completed.',
      });
    }

    const existingReview = await TutoringReview.findOne({ session: session._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this session.',
      });
    }

    const review = await TutoringReview.create({
      session: session._id,
      tutor: session.tutor,
      student: req.user._id,
      rating: parseInt(rating, 10),
      comment: comment || '',
    });

    session.hasReview = true;
    await session.save();

    // Recalculate tutor rating average
    const allReviews = await TutoringReview.find({ tutor: session.tutor });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await TutorProfile.findOneAndUpdate(
      { user: session.tutor },
      {
        ratingAverage: Math.round(avgRating * 10) / 10,
        ratingCount: allReviews.length,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Thank you for supporting peer learning!',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
