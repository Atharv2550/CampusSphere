import { DutyAssignment } from '../models/DutyAssignment.js';
import { AuditLog } from '../models/AuditLog.js';
import { notifyUser } from '../services/notificationService.js';
import { detectDutyConflicts } from '../services/conflictDetectionService.js';

// GET /api/duties/my (Faculty)
export const getMyDuties = async (req, res, next) => {
  try {
    const facultyId = req.user._id;

    const duties = await DutyAssignment.find({
      $or: [{ faculty: facultyId }, { originalFaculty: facultyId }],
    })
      .populate('faculty', 'fullName email')
      .populate('originalFaculty', 'fullName email')
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .populate('assignedBy', 'fullName email')
      .sort({ date: -1, startTime: 1 });

    return res.json({ success: true, count: duties.length, data: duties });
  } catch (error) {
    next(error);
  }
};

// GET /api/duties/admin (Admin)
export const getAdminDuties = async (req, res, next) => {
  try {
    const { faculty, type, status, date } = req.query;
    const filter = {};
    if (faculty) filter.faculty = faculty;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const duties = await DutyAssignment.find(filter)
      .populate('faculty', 'fullName email department')
      .populate('originalFaculty', 'fullName email')
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .populate('assignedBy', 'fullName')
      .sort({ date: -1, startTime: 1 });

    return res.json({ success: true, count: duties.length, data: duties });
  } catch (error) {
    next(error);
  }
};

// POST /api/duties/admin (Admin)
export const createDuty = async (req, res, next) => {
  try {
    const {
      faculty,
      originalFaculty,
      type,
      title,
      subject,
      classDivision,
      date,
      startTime,
      endTime,
      room,
      reason,
      notes,
    } = req.body;

    // Detect server-side conflicts
    const conflictResult = await detectDutyConflicts({
      faculty,
      date,
      startTime,
      endTime,
      room,
    });

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Schedule conflict detected for faculty.',
        conflicts: conflictResult.conflicts,
      });
    }

    const duty = await DutyAssignment.create({
      faculty,
      originalFaculty: originalFaculty || null,
      type,
      title,
      subject: subject || null,
      classDivision: classDivision || null,
      date,
      startTime,
      endTime,
      room,
      reason,
      notes,
      assignedBy: req.user._id,
      status: 'Assigned',
    });

    const populated = await DutyAssignment.findById(duty._id)
      .populate('faculty', 'fullName email')
      .populate('originalFaculty', 'fullName email')
      .populate('subject', 'name code')
      .populate('classDivision', 'name');

    // Notify assigned faculty
    const formattedDate = new Date(date).toLocaleDateString();
    await notifyUser(faculty, {
      title: `New Duty Assignment: ${type}`,
      message: `You have been assigned to "${title}" on ${formattedDate} (${startTime} - ${endTime}) in ${room || 'Campus'}.`,
      type: 'system',
      link: '/faculty/duties',
    });

    // If substitution, notify original faculty too
    if (originalFaculty) {
      await notifyUser(originalFaculty, {
        title: 'Substitution Arranged for Your Lecture',
        message: `Prof. ${populated.faculty?.fullName} will substitute for your class "${title}" on ${formattedDate} (${startTime} - ${endTime}).`,
        type: 'system',
        link: '/faculty/duties',
      });
    }

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'ASSIGN_FACULTY_DUTY',
      entity: 'DutyAssignment',
      entityId: duty._id,
      details: { faculty, type, title, date, startTime, endTime },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Duty / substitution assigned successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/duties/:id/status
export const updateDutyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Assigned', 'Acknowledged', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid duty status.' });
    }

    const duty = await DutyAssignment.findById(id);
    if (!duty) {
      return res.status(404).json({ success: false, message: 'Duty assignment not found.' });
    }

    // Faculty can only acknowledge or complete their own duties
    if (req.user.role === 'faculty') {
      if (duty.faculty.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this duty.' });
      }
    }

    duty.status = status;
    await duty.save();

    const populated = await DutyAssignment.findById(id)
      .populate('faculty', 'fullName email')
      .populate('originalFaculty', 'fullName email')
      .populate('subject', 'name code')
      .populate('classDivision', 'name');

    return res.json({
      success: true,
      message: `Duty status updated to ${status}.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/duties/admin/:id
export const deleteDuty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const duty = await DutyAssignment.findById(id).populate('faculty', 'fullName email');
    if (!duty) {
      return res.status(404).json({ success: false, message: 'Duty assignment not found.' });
    }

    await DutyAssignment.findByIdAndDelete(id);

    if (duty.faculty) {
      await notifyUser(duty.faculty._id, {
        title: 'Duty Assignment Cancelled',
        message: `Your assigned duty "${duty.title}" scheduled for ${new Date(duty.date).toLocaleDateString()} has been cancelled.`,
        type: 'system',
        link: '/faculty/duties',
      });
    }

    return res.json({ success: true, message: 'Duty cancelled and removed.' });
  } catch (error) {
    next(error);
  }
};
