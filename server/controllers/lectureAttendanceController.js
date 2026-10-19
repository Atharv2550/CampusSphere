import { LectureAttendance } from '../models/LectureAttendance.js';
import { TimetableEntry } from '../models/TimetableEntry.js';
import { DutyAssignment } from '../models/DutyAssignment.js';
import { AuditLog } from '../models/AuditLog.js';

// POST /api/attendance (Faculty only)
export const recordAttendance = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const {
      timetableEntry,
      dutyAssignment,
      subject,
      classDivision,
      date,
      startTime,
      endTime,
      topic,
      records = [],
    } = req.body;

    // Validate faculty authorization
    if (req.user.role === 'faculty') {
      const isRegularFaculty = await TimetableEntry.exists({
        faculty: facultyId,
        subject,
        classDivision,
        status: 'Published',
      });

      const isSubstitutedFaculty = await DutyAssignment.exists({
        faculty: facultyId,
        subject,
        classDivision,
        status: { $in: ['Assigned', 'Acknowledged', 'Completed'] },
      });

      if (!isRegularFaculty && !isSubstitutedFaculty) {
        return res.status(403).json({
          success: false,
          message: 'Authorization failed: You are not authorized to record attendance for this class and subject.',
        });
      }
    }

    // Check duplicate attendance for the same lecture slot on the same date
    const lectureDate = new Date(date);
    const startOfDay = new Date(lectureDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(lectureDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await LectureAttendance.findOne({
      faculty: facultyId,
      subject,
      classDivision,
      date: { $gte: startOfDay, $lte: endOfDay },
      startTime,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate attendance: Attendance has already been recorded for this lecture slot today.',
      });
    }

    // Compute summary metrics
    const totalStudents = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const lateCount = records.filter((r) => r.status === 'Late').length;
    const absentCount = records.filter((r) => r.status === 'Absent').length;
    const effectivePresent = presentCount + lateCount;
    const attendanceRate = totalStudents > 0 ? Math.round((effectivePresent / totalStudents) * 100) : 0;

    const attendance = await LectureAttendance.create({
      timetableEntry: timetableEntry || null,
      dutyAssignment: dutyAssignment || null,
      faculty: facultyId,
      subject,
      classDivision,
      date: lectureDate,
      startTime,
      endTime,
      topic,
      records,
      summary: {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate,
      },
    });

    const populated = await LectureAttendance.findById(attendance._id)
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .populate('records.student', 'fullName email studentId');

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'RECORD_LECTURE_ATTENDANCE',
      entity: 'LectureAttendance',
      entityId: attendance._id,
      details: { subject, classDivision, date, topic, attendanceRate },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Lecture attendance recorded successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/my-history (Faculty)
export const getMyAttendanceHistory = async (req, res, next) => {
  try {
    const facultyId = req.user._id;

    const history = await LectureAttendance.find({ faculty: facultyId })
      .populate('subject', 'name code semester')
      .populate('classDivision', 'name code')
      .sort({ date: -1, startTime: -1 })
      .limit(50);

    return res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/:id
export const getAttendanceDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attendance = await LectureAttendance.findById(id)
      .populate('faculty', 'fullName email')
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .populate('records.student', 'fullName email studentId avatar');

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    return res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};
