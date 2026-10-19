import { TimetableEntry } from '../models/TimetableEntry.js';
import { DutyAssignment } from '../models/DutyAssignment.js';
import { Subject } from '../models/Subject.js';
import { ClassDivision } from '../models/ClassDivision.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { notifyUser } from '../services/notificationService.js';
import { detectTimetableConflicts } from '../services/conflictDetectionService.js';

// GET /api/timetable/my (Faculty only)
export const getMyTimetable = async (req, res, next) => {
  try {
    const facultyId = req.user._id;

    // Fetch all published timetable entries for this faculty
    const entries = await TimetableEntry.find({
      faculty: facultyId,
      status: 'Published',
    })
      .populate('subject')
      .populate('classDivision')
      .populate('department')
      .sort({ startTime: 1 });

    // Also fetch any substitutions or duties assigned to this faculty
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const duties = await DutyAssignment.find({
      faculty: facultyId,
      status: { $in: ['Assigned', 'Acknowledged'] },
    })
      .populate('subject')
      .populate('classDivision')
      .populate('originalFaculty', 'fullName email')
      .sort({ date: 1, startTime: 1 });

    // Determine today's day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = days[today.getDay()];

    const todayLectures = entries.filter((e) => e.dayOfWeek === todayDayName);

    return res.json({
      success: true,
      data: {
        entries,
        duties,
        todayDayName,
        todayLectures,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/timetable/admin (Admin only)
export const getAdminTimetable = async (req, res, next) => {
  try {
    const { faculty, department, classDivision, dayOfWeek, status } = req.query;
    const filter = {};

    if (faculty) filter.faculty = faculty;
    if (department) filter.department = department;
    if (classDivision) filter.classDivision = classDivision;
    if (dayOfWeek) filter.dayOfWeek = dayOfWeek;
    if (status) filter.status = status;

    const entries = await TimetableEntry.find(filter)
      .populate('faculty', 'fullName email department')
      .populate('subject', 'name code semester credits')
      .populate('classDivision', 'name code')
      .populate('department', 'name code')
      .sort({ dayOfWeek: 1, startTime: 1 });

    return res.json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/timetable/check-conflict
export const checkConflictEndpoint = async (req, res, next) => {
  try {
    const { faculty, room, classDivision, dayOfWeek, startTime, endTime, effectiveFrom, effectiveUntil, excludeId } = req.body;

    const conflictResult = await detectTimetableConflicts({
      faculty,
      room,
      classDivision,
      dayOfWeek,
      startTime,
      endTime,
      effectiveFrom,
      effectiveUntil,
      excludeId,
    });

    return res.json({
      success: true,
      ...conflictResult,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/timetable/admin (Admin only)
export const createTimetableEntry = async (req, res, next) => {
  try {
    const {
      faculty,
      subject,
      classDivision,
      department,
      dayOfWeek,
      startTime,
      endTime,
      room,
      activityType = 'Theory',
      effectiveFrom,
      effectiveUntil,
      status = 'Published',
      notes = '',
    } = req.body;

    // Detect server-side conflicts
    const conflictResult = await detectTimetableConflicts({
      faculty,
      room,
      classDivision,
      dayOfWeek,
      startTime,
      endTime,
      effectiveFrom,
      effectiveUntil,
    });

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Timetable conflict detected. Overlapping schedule exists.',
        conflicts: conflictResult.conflicts,
      });
    }

    const entry = await TimetableEntry.create({
      faculty,
      subject,
      classDivision,
      department,
      dayOfWeek,
      startTime,
      endTime,
      room,
      activityType,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveUntil: effectiveUntil || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status,
      notes,
      createdBy: req.user._id,
    });

    const populatedEntry = await TimetableEntry.findById(entry._id)
      .populate('faculty', 'fullName email')
      .populate('subject', 'name code')
      .populate('classDivision', 'name');

    // Notify the assigned faculty member
    await notifyUser(faculty, {
      title: 'New Timetable Assignment',
      message: `You have been assigned to ${populatedEntry.subject?.name} (${activityType}) on ${dayOfWeek}s at ${startTime}-${endTime} in ${room}.`,
      type: 'system',
      link: '/faculty/timetable',
    });

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_TIMETABLE_ENTRY',
      entity: 'TimetableEntry',
      entityId: entry._id,
      details: { faculty, subject, dayOfWeek, startTime, endTime, room },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Timetable entry created and published successfully.',
      data: populatedEntry,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/timetable/admin/:id
export const updateTimetableEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await TimetableEntry.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
    }

    // Check conflict if schedule attributes are modified
    if (
      updates.startTime ||
      updates.endTime ||
      updates.dayOfWeek ||
      updates.room ||
      updates.faculty ||
      updates.classDivision
    ) {
      const conflictResult = await detectTimetableConflicts({
        faculty: updates.faculty || existing.faculty,
        room: updates.room || existing.room,
        classDivision: updates.classDivision || existing.classDivision,
        dayOfWeek: updates.dayOfWeek || existing.dayOfWeek,
        startTime: updates.startTime || existing.startTime,
        endTime: updates.endTime || existing.endTime,
        effectiveFrom: updates.effectiveFrom || existing.effectiveFrom,
        effectiveUntil: updates.effectiveUntil || existing.effectiveUntil,
        excludeId: id,
      });

      if (conflictResult.hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'Conflict detected with updated schedule.',
          conflicts: conflictResult.conflicts,
        });
      }
    }

    Object.assign(existing, updates);
    await existing.save();

    const populated = await TimetableEntry.findById(id)
      .populate('faculty', 'fullName email')
      .populate('subject', 'name code')
      .populate('classDivision', 'name');

    // Notify faculty of schedule revision
    await notifyUser(existing.faculty, {
      title: 'Timetable Schedule Updated',
      message: `Your schedule for ${populated.subject?.name} has been updated: ${existing.dayOfWeek} ${existing.startTime}-${existing.endTime} in ${existing.room}.`,
      type: 'system',
      link: '/faculty/timetable',
    });

    return res.json({
      success: true,
      message: 'Timetable entry updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/timetable/admin/:id
export const deleteTimetableEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const entry = await TimetableEntry.findById(id).populate('faculty', 'fullName email').populate('subject', 'name');

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
    }

    await TimetableEntry.findByIdAndDelete(id);

    // Notify faculty
    if (entry.faculty) {
      await notifyUser(entry.faculty._id, {
        title: 'Timetable Class Cancelled',
        message: `Your scheduled lecture for ${entry.subject?.name} on ${entry.dayOfWeek} has been cancelled/removed.`,
        type: 'system',
        link: '/faculty/timetable',
      });
    }

    return res.json({
      success: true,
      message: 'Timetable entry deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
