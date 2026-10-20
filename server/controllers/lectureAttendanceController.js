import mongoose from 'mongoose';
import { LectureAttendance } from '../models/LectureAttendance.js';
import { TimetableEntry } from '../models/TimetableEntry.js';
import { DutyAssignment } from '../models/DutyAssignment.js';
import { Subject } from '../models/Subject.js';
import { ClassDivision } from '../models/ClassDivision.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

// Helper to normalize dates to UTC midnight to avoid timezone shifting
const normalizeDate = (dateInput) => {
  if (!dateInput) return new Date();
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  // Use date string YYYY-MM-DD components
  const isoStr = typeof dateInput === 'string' ? dateInput.split('T')[0] : d.toISOString().split('T')[0];
  const [year, month, day] = isoStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

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
      latePolicy = 'half', // 'half' = 0.5 credit, 'full' = 1.0 credit, 'none' = 0 credit
    } = req.body;

    // 1. Field validation
    if (!subject) {
      return res.status(422).json({ success: false, message: 'Subject identifier is required.' });
    }
    if (!classDivision) {
      return res.status(422).json({ success: false, message: 'Class division identifier is required.' });
    }
    if (!date) {
      return res.status(422).json({ success: false, message: 'Lecture date is required.' });
    }
    const normalizedLectureDate = normalizeDate(date);
    if (!normalizedLectureDate) {
      return res.status(422).json({ success: false, message: 'Invalid lecture date format. Use YYYY-MM-DD.' });
    }
    if (!startTime || !startTime.trim()) {
      return res.status(422).json({ success: false, message: 'Start time is required (e.g. 09:00).' });
    }
    if (!endTime || !endTime.trim()) {
      return res.status(422).json({ success: false, message: 'End time is required (e.g. 10:00).' });
    }
    if (!topic || !topic.trim()) {
      return res.status(422).json({ success: false, message: 'Lecture topic or syllabus unit is required.' });
    }

    // 2. Validate and deduplicate student records
    const seenStudentIds = new Set();
    const sanitizedRecords = [];

    for (const r of records) {
      if (!r || !r.student) {
        return res.status(422).json({ success: false, message: 'Each attendance record must include a valid student ID.' });
      }
      const studentIdStr = (r.student._id || r.student).toString();
      if (!mongoose.Types.ObjectId.isValid(studentIdStr)) {
        return res.status(422).json({ success: false, message: `Invalid student ID format: ${studentIdStr}` });
      }

      if (seenStudentIds.has(studentIdStr)) {
        continue; // deduplicate
      }
      seenStudentIds.add(studentIdStr);

      const statusUpper = (r.status || 'Present').trim();
      if (!['Present', 'Absent', 'Late'].includes(statusUpper)) {
        return res.status(422).json({
          success: false,
          message: `Invalid attendance status "${r.status}". Must be Present, Absent, or Late.`,
        });
      }

      sanitizedRecords.push({
        student: studentIdStr,
        status: statusUpper,
        remarks: r.remarks ? String(r.remarks).trim() : '',
        lastModifiedBy: facultyId,
        updatedAt: new Date(),
      });
    }

    if (sanitizedRecords.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'At least one valid enrolled student attendance record is required.',
      });
    }

    // 3. Faculty Authorization
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

    // 4. Duplicate Attendance Check for the exact lecture slot on this date
    const startOfDay = new Date(normalizedLectureDate);
    const endOfDay = new Date(normalizedLectureDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existing = await LectureAttendance.findOne({
      faculty: facultyId,
      subject,
      classDivision,
      date: { $gte: startOfDay, $lte: endOfDay },
      startTime: startTime.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate attendance: Attendance has already been recorded for this lecture slot on this date.',
        existingSessionId: existing._id,
        existingSession: {
          _id: existing._id,
          topic: existing.topic,
          date: existing.date,
          startTime: existing.startTime,
          endTime: existing.endTime,
          sessionStatus: existing.sessionStatus,
          attendanceRate: existing.summary?.attendanceRate,
          totalStudents: existing.summary?.totalStudents,
          presentCount: existing.summary?.presentCount,
          lateCount: existing.summary?.lateCount,
          absentCount: existing.summary?.absentCount,
        },
      });
    }

    // 5. Fetch class division details for academic year & semester
    const classDivDoc = await ClassDivision.findById(classDivision).lean();
    const subjectDoc = await Subject.findById(subject).lean();

    // 6. Compute summary metrics according to institutional late policy
    const totalStudents = sanitizedRecords.length;
    const presentCount = sanitizedRecords.filter((r) => r.status === 'Present').length;
    const lateCount = sanitizedRecords.filter((r) => r.status === 'Late').length;
    const absentCount = sanitizedRecords.filter((r) => r.status === 'Absent').length;

    const lateCredit = latePolicy === 'full' ? 1.0 : latePolicy === 'none' ? 0.0 : 0.5;
    const effectivePresent = presentCount + lateCredit * lateCount;
    const attendanceRate = totalStudents > 0 ? Math.round((effectivePresent / totalStudents) * 100) : 0;

    // 7. Persist Attendance Session
    const attendance = await LectureAttendance.create({
      timetableEntry: timetableEntry || null,
      dutyAssignment: dutyAssignment || null,
      faculty: facultyId,
      subject,
      classDivision,
      academicYear: classDivDoc?.academicYear || '2026-2027',
      semester: classDivDoc?.semester || subjectDoc?.semester || 1,
      date: normalizedLectureDate,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      topic: topic.trim(),
      sessionStatus: 'Submitted',
      records: sanitizedRecords,
      summary: {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate,
      },
    });

    const populated = await LectureAttendance.findById(attendance._id)
      .populate('faculty', 'fullName email')
      .populate('subject', 'name code semester credits')
      .populate('classDivision', 'name code department semester academicYear')
      .populate('records.student', 'fullName email studentId avatar');

    // 8. Audit log entry
    await AuditLog.create({
      user: facultyId,
      action: 'RECORD_LECTURE_ATTENDANCE',
      targetType: 'LectureAttendance',
      targetId: attendance._id,
      details: {
        subject: subjectDoc?.code || subject,
        classDivision: classDivDoc?.code || classDivision,
        date: normalizedLectureDate,
        topic: topic.trim(),
        totalStudents,
        attendanceRate,
      },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Lecture attendance recorded successfully.',
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate attendance: Attendance has already been recorded for this lecture slot on this date.',
      });
    }
    next(error);
  }
};

// GET /api/attendance/check-session
export const checkExistingSession = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const { subject, classDivision, date, startTime } = req.query;

    if (!subject || !classDivision || !date) {
      return res.json({ success: true, exists: false, session: null });
    }

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      return res.json({ success: true, exists: false, session: null });
    }

    const startOfDay = new Date(normalizedDate);
    const endOfDay = new Date(normalizedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const query = {
      faculty: facultyId,
      subject,
      classDivision,
      date: { $gte: startOfDay, $lte: endOfDay },
    };
    if (startTime && startTime.trim()) {
      query.startTime = startTime.trim();
    }

    const existing = await LectureAttendance.findOne(query)
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .populate('records.student', 'fullName email studentId avatar')
      .lean();

    if (!existing) {
      return res.json({ success: true, exists: false, session: null });
    }

    return res.json({
      success: true,
      exists: true,
      session: existing,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/sessions (Paginated & Filtered Attendance Sessions)
export const getAttendanceSessions = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const {
      subject,
      classDivision,
      startDate,
      endDate,
      status,
      search,
      page = 1,
      limit = 15,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (req.user.role === 'faculty') {
      filter.faculty = facultyId;
    } else if (req.query.faculty) {
      filter.faculty = req.query.faculty;
    }

    if (subject) filter.subject = subject;
    if (classDivision) filter.classDivision = classDivision;
    if (status) filter.sessionStatus = status;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = normalizeDate(startDate);
        if (start) filter.date.$gte = start;
      }
      if (endDate) {
        const end = normalizeDate(endDate);
        if (end) {
          end.setUTCHours(23, 59, 59, 999);
          filter.date.$lte = end;
        }
      }
    }

    if (search && search.trim()) {
      filter.topic = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1, startTime: -1 };

    const [total, sessions] = await Promise.all([
      LectureAttendance.countDocuments(filter),
      LectureAttendance.find(filter)
        .populate('faculty', 'fullName email')
        .populate('subject', 'name code semester credits')
        .populate('classDivision', 'name code semester academicYear')
        .populate('records.student', 'fullName email studentId avatar')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return res.json({
      success: true,
      count: sessions.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/sessions/:id
export const getAttendanceDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attendance = await LectureAttendance.findById(id)
      .populate('faculty', 'fullName email')
      .populate('subject', 'name code semester credits')
      .populate('classDivision', 'name code semester academicYear department')
      .populate('records.student', 'fullName email studentId avatar')
      .populate('editHistory.modifiedBy', 'fullName email role')
      .populate('editHistory.changes.student', 'fullName studentId')
      .lean();

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance session not found.' });
    }

    // Role verification
    if (req.user.role === 'faculty' && attendance.faculty._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: You cannot view attendance recorded by another faculty member.',
      });
    }

    return res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/attendance/sessions/:id (Authorized Attendance Correction)
export const updateAttendanceSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facultyId = req.user._id;
    const { topic, records, reason, latePolicy = 'half' } = req.body;

    const session = await LectureAttendance.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found.' });
    }

    // Enforce faculty authorization
    if (req.user.role === 'faculty' && session.faculty.toString() !== facultyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Authorization failed: You can only edit attendance sessions you submitted.',
      });
    }

    const changes = [];
    if (Array.isArray(records) && records.length > 0) {
      const recordsMap = new Map();
      records.forEach((r) => {
        if (r.student) {
          const sId = (r.student._id || r.student).toString();
          recordsMap.set(sId, {
            status: ['Present', 'Absent', 'Late'].includes(r.status) ? r.status : 'Present',
            remarks: r.remarks ? String(r.remarks).trim() : '',
          });
        }
      });

      // Update student statuses and record changes
      for (const rec of session.records) {
        const sId = rec.student.toString();
        if (recordsMap.has(sId)) {
          const update = recordsMap.get(sId);
          if (rec.status !== update.status) {
            changes.push({
              student: rec.student,
              previousStatus: rec.status,
              newStatus: update.status,
            });
            rec.status = update.status;
            rec.lastModifiedBy = facultyId;
            rec.updatedAt = new Date();
          }
          if (update.remarks !== undefined) {
            rec.remarks = update.remarks;
          }
        }
      }
    }

    let hasModified = changes.length > 0;
    if (topic && topic.trim() && topic.trim() !== session.topic) {
      session.topic = topic.trim();
      hasModified = true;
    }

    // If changes occurred, add to editHistory
    if (hasModified || reason) {
      session.editHistory.push({
        modifiedBy: facultyId,
        modifiedAt: new Date(),
        reason: reason?.trim() || 'Manual attendance correction by faculty',
        changes,
      });
      session.sessionStatus = 'Corrected';
    }

    // Recompute summary
    const totalStudents = session.records.length;
    const presentCount = session.records.filter((r) => r.status === 'Present').length;
    const lateCount = session.records.filter((r) => r.status === 'Late').length;
    const absentCount = session.records.filter((r) => r.status === 'Absent').length;

    const lateCredit = latePolicy === 'full' ? 1.0 : latePolicy === 'none' ? 0.0 : 0.5;
    const effectivePresent = presentCount + lateCredit * lateCount;
    const attendanceRate = totalStudents > 0 ? Math.round((effectivePresent / totalStudents) * 100) : 0;

    session.summary = {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
    };

    await session.save();

    const updated = await LectureAttendance.findById(id)
      .populate('faculty', 'fullName email')
      .populate('subject', 'name code semester credits')
      .populate('classDivision', 'name code semester academicYear')
      .populate('records.student', 'fullName email studentId avatar')
      .populate('editHistory.modifiedBy', 'fullName email role')
      .populate('editHistory.changes.student', 'fullName studentId')
      .lean();

    // Audit Log
    await AuditLog.create({
      user: facultyId,
      action: 'UPDATE_LECTURE_ATTENDANCE',
      targetType: 'LectureAttendance',
      targetId: session._id,
      details: {
        changesCount: changes.length,
        reason: reason || 'Attendance correction',
        attendanceRate,
      },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Attendance session updated and audit log recorded successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/student/:studentId (Individual Student Attendance Report)
export const getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const facultyId = req.user._id;
    const { subject, classDivision, startDate, endDate, latePolicy = 'half' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format.' });
    }

    const studentUser = await User.findById(studentId)
      .select('fullName email studentId department academicYear avatar')
      .populate('department', 'name code')
      .lean();

    if (!studentUser) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Build session query
    const filter = {
      'records.student': studentId,
      sessionStatus: { $ne: 'Cancelled' }, // Exclude cancelled sessions from denominator
    };

    if (req.user.role === 'faculty') {
      filter.faculty = facultyId;
    }
    if (subject) filter.subject = subject;
    if (classDivision) filter.classDivision = classDivision;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = normalizeDate(startDate);
        if (start) filter.date.$gte = start;
      }
      if (endDate) {
        const end = normalizeDate(endDate);
        if (end) {
          end.setUTCHours(23, 59, 59, 999);
          filter.date.$lte = end;
        }
      }
    }

    const sessions = await LectureAttendance.find(filter)
      .populate('subject', 'name code credits semester')
      .populate('classDivision', 'name code semester academicYear')
      .populate('faculty', 'fullName email')
      .sort({ date: -1, startTime: -1 })
      .lean();

    // Map student-specific attendance records
    const history = [];
    const missedLectures = [];
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    // Subject-wise grouping
    const subjectMap = new Map();

    for (const session of sessions) {
      const studentRecord = session.records.find(
        (r) => r.student.toString() === studentId.toString()
      );

      if (!studentRecord) continue;

      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const sessionDate = new Date(session.date);
      const weekday = weekdayNames[sessionDate.getUTCDay()];

      const item = {
        sessionId: session._id,
        date: session.date,
        weekday,
        startTime: session.startTime,
        endTime: session.endTime,
        subject: session.subject,
        classDivision: session.classDivision,
        topic: session.topic,
        faculty: session.faculty,
        status: studentRecord.status,
        remarks: studentRecord.remarks || '',
        sessionStatus: session.sessionStatus,
      };

      history.push(item);

      if (studentRecord.status === 'Present') presentCount += 1;
      else if (studentRecord.status === 'Late') lateCount += 1;
      else if (studentRecord.status === 'Absent') {
        absentCount += 1;
        missedLectures.push(item);
      }

      // Group by subject
      const subKey = session.subject?._id?.toString() || 'unknown';
      if (!subjectMap.has(subKey)) {
        subjectMap.set(subKey, {
          subject: session.subject,
          totalEligible: 0,
          present: 0,
          late: 0,
          absent: 0,
        });
      }
      const subEntry = subjectMap.get(subKey);
      subEntry.totalEligible += 1;
      if (studentRecord.status === 'Present') subEntry.present += 1;
      else if (studentRecord.status === 'Late') subEntry.late += 1;
      else if (studentRecord.status === 'Absent') subEntry.absent += 1;
    }

    const totalEligible = history.length;
    const lateCredit = latePolicy === 'full' ? 1.0 : latePolicy === 'none' ? 0.0 : 0.5;
    const effectivePresent = presentCount + lateCredit * lateCount;
    const attendancePercentage = totalEligible > 0 ? Math.round((effectivePresent / totalEligible) * 100) : 0;

    // Finalize subject summaries
    const subjectSummaries = Array.from(subjectMap.values()).map((s) => {
      const eff = s.present + lateCredit * s.late;
      return {
        ...s,
        effectivePresent: eff,
        attendancePercentage: s.totalEligible > 0 ? Math.round((eff / s.totalEligible) * 100) : 0,
      };
    });

    return res.json({
      success: true,
      student: studentUser,
      overallMetrics: {
        totalEligibleLectures: totalEligible,
        presentCount,
        lateCount,
        absentCount,
        effectivePresent,
        attendancePercentage,
        latePolicy,
      },
      subjectSummaries,
      history,
      missedLectures,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/reports/subject
export const getSubjectReport = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const filter = req.user.role === 'faculty' ? { faculty: facultyId } : {};

    const sessions = await LectureAttendance.find(filter)
      .populate('subject', 'name code credits semester')
      .populate('classDivision', 'name code')
      .lean();

    const subjectMap = new Map();

    for (const s of sessions) {
      if (!s.subject) continue;
      const key = s.subject._id.toString();
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subject: s.subject,
          totalSessions: 0,
          totalEnrolledStudents: 0,
          sumPresent: 0,
          sumLate: 0,
          sumAbsent: 0,
          sumAttendanceRate: 0,
          classes: new Set(),
          latestSessionDate: s.date,
        });
      }
      const entry = subjectMap.get(key);
      entry.totalSessions += 1;
      entry.totalEnrolledStudents += s.summary?.totalStudents || 0;
      entry.sumPresent += s.summary?.presentCount || 0;
      entry.sumLate += s.summary?.lateCount || 0;
      entry.sumAbsent += s.summary?.absentCount || 0;
      entry.sumAttendanceRate += s.summary?.attendanceRate || 0;
      if (s.classDivision?.name) entry.classes.add(s.classDivision.name);
      if (new Date(s.date) > new Date(entry.latestSessionDate)) {
        entry.latestSessionDate = s.date;
      }
    }

    const report = Array.from(subjectMap.values()).map((e) => ({
      subject: e.subject,
      totalSessions: e.totalSessions,
      totalEnrolledStudents: e.totalEnrolledStudents,
      presentCount: e.sumPresent,
      lateCount: e.sumLate,
      absentCount: e.sumAbsent,
      classes: Array.from(e.classes),
      averageAttendanceRate: e.totalSessions > 0 ? Math.round(e.sumAttendanceRate / e.totalSessions) : 0,
      latestSessionDate: e.latestSessionDate,
    }));

    return res.json({ success: true, count: report.length, data: report });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/reports/class
export const getClassReport = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const filter = req.user.role === 'faculty' ? { faculty: facultyId } : {};

    const sessions = await LectureAttendance.find(filter)
      .populate('classDivision', 'name code semester academicYear department')
      .populate('subject', 'name code')
      .lean();

    const classMap = new Map();

    for (const s of sessions) {
      if (!s.classDivision) continue;
      const key = s.classDivision._id.toString();
      if (!classMap.has(key)) {
        classMap.set(key, {
          classDivision: s.classDivision,
          totalSessions: 0,
          totalStudents: s.summary?.totalStudents || 0,
          sumAttendanceRate: 0,
          subjects: new Set(),
        });
      }
      const entry = classMap.get(key);
      entry.totalSessions += 1;
      entry.sumAttendanceRate += s.summary?.attendanceRate || 0;
      if (s.subject?.name) entry.subjects.add(s.subject.code || s.subject.name);
    }

    const report = Array.from(classMap.values()).map((e) => ({
      classDivision: e.classDivision,
      totalSessions: e.totalSessions,
      studentCount: e.totalStudents,
      subjects: Array.from(e.subjects),
      averageAttendanceRate: e.totalSessions > 0 ? Math.round(e.sumAttendanceRate / e.totalSessions) : 0,
    }));

    return res.json({ success: true, count: report.length, data: report });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/reports/daily
export const getDailyReport = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const { date, startDate, endDate } = req.query;

    const filter = req.user.role === 'faculty' ? { faculty: facultyId } : {};

    if (date) {
      const d = normalizeDate(date);
      if (d) {
        const nextDay = new Date(d);
        nextDay.setUTCHours(23, 59, 59, 999);
        filter.date = { $gte: d, $lte: nextDay };
      }
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = normalizeDate(startDate);
        if (s) filter.date.$gte = s;
      }
      if (endDate) {
        const e = normalizeDate(endDate);
        if (e) {
          e.setUTCHours(23, 59, 59, 999);
          filter.date.$lte = e;
        }
      }
    } else {
      // Default to today
      const today = normalizeDate(new Date());
      const endToday = new Date(today);
      endToday.setUTCHours(23, 59, 59, 999);
      filter.date = { $gte: today, $lte: endToday };
    }

    const sessions = await LectureAttendance.find(filter)
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .sort({ startTime: 1 })
      .lean();

    return res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/reports/summary
export const getSummaryMetrics = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const filter = req.user.role === 'faculty' ? { faculty: facultyId } : {};

    const sessions = await LectureAttendance.find(filter).lean();

    const totalSessions = sessions.length;
    let sumAttendanceRate = 0;
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    const distinctStudents = new Set();

    sessions.forEach((s) => {
      sumAttendanceRate += s.summary?.attendanceRate || 0;
      totalPresent += s.summary?.presentCount || 0;
      totalLate += s.summary?.lateCount || 0;
      totalAbsent += s.summary?.absentCount || 0;
      if (s.records) {
        s.records.forEach((r) => {
          if (r.student) distinctStudents.add(r.student.toString());
        });
      }
    });

    const averageAttendanceRate = totalSessions > 0 ? Math.round(sumAttendanceRate / totalSessions) : 0;

    return res.json({
      success: true,
      data: {
        totalSessions,
        averageAttendanceRate,
        totalPresent,
        totalLate,
        totalAbsent,
        distinctStudentsCount: distinctStudents.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/missing (Expected lectures from timetable with unsubmitted attendance)
export const getMissingAttendance = async (req, res, next) => {
  try {
    const facultyId = req.user._id;

    // Get published timetable entries for this faculty
    const entries = await TimetableEntry.find({
      faculty: facultyId,
      status: 'Published',
    })
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .lean();

    if (entries.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // Inspect the past 7 days (excluding future dates)
    const today = new Date();
    const missing = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 1; i <= 7; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const normalizedPast = normalizeDate(pastDate);
      const dayOfWeek = dayNames[normalizedPast.getUTCDay()];

      if (dayOfWeek === 'Sunday') continue; // Skip Sunday

      // Find timetable entries scheduled on this day of week
      const scheduledForDay = entries.filter((e) => e.dayOfWeek === dayOfWeek);

      for (const entry of scheduledForDay) {
        if (!entry.subject || !entry.classDivision) continue;

        // Check if attendance exists
        const startOfDay = new Date(normalizedPast);
        const endOfDay = new Date(normalizedPast);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const exists = await LectureAttendance.exists({
          faculty: facultyId,
          subject: entry.subject._id,
          classDivision: entry.classDivision._id,
          date: { $gte: startOfDay, $lte: endOfDay },
          startTime: entry.startTime,
        });

        if (!exists) {
          missing.push({
            date: normalizedPast,
            dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            room: entry.room,
            activityType: entry.activityType,
            subject: entry.subject,
            classDivision: entry.classDivision,
            status: 'Not Recorded',
          });
        }
      }
    }

    return res.json({ success: true, count: missing.length, data: missing });
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/export-csv
export const exportAttendanceCSV = async (req, res, next) => {
  try {
    const facultyId = req.user._id;
    const { subject, classDivision, startDate, endDate } = req.query;

    const filter = req.user.role === 'faculty' ? { faculty: facultyId } : {};
    if (subject) filter.subject = subject;
    if (classDivision) filter.classDivision = classDivision;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = normalizeDate(startDate);
        if (s) filter.date.$gte = s;
      }
      if (endDate) {
        const e = normalizeDate(endDate);
        if (e) {
          e.setUTCHours(23, 59, 59, 999);
          filter.date.$lte = e;
        }
      }
    }

    const sessions = await LectureAttendance.find(filter)
      .populate('faculty', 'fullName')
      .populate('subject', 'name code')
      .populate('classDivision', 'name code')
      .sort({ date: -1, startTime: -1 })
      .lean();

    const headers = [
      'Date',
      'Weekday',
      'Time Slot',
      'Subject Code',
      'Subject Name',
      'Class Division',
      'Lecture Topic',
      'Total Students',
      'Present',
      'Late',
      'Absent',
      'Attendance Rate (%)',
      'Status',
    ];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const rows = sessions.map((s) => {
      const d = new Date(s.date);
      const weekday = dayNames[d.getUTCDay()];
      const dateStr = d.toISOString().split('T')[0];
      const timeSlot = `${s.startTime} - ${s.endTime}`;
      const subCode = `"${(s.subject?.code || '').replace(/"/g, '""')}"`;
      const subName = `"${(s.subject?.name || '').replace(/"/g, '""')}"`;
      const classDiv = `"${(s.classDivision?.name || '').replace(/"/g, '""')}"`;
      const topic = `"${(s.topic || '').replace(/"/g, '""')}"`;

      return [
        dateStr,
        weekday,
        `"${timeSlot}"`,
        subCode,
        subName,
        classDiv,
        topic,
        s.summary?.totalStudents || 0,
        s.summary?.presentCount || 0,
        s.summary?.lateCount || 0,
        s.summary?.absentCount || 0,
        `${s.summary?.attendanceRate || 0}%`,
        s.sessionStatus || 'Submitted',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/my-history (Backward-compatible)
export const getMyAttendanceHistory = async (req, res, next) => {
  try {
    const facultyId = req.user._id;

    const history = await LectureAttendance.find({ faculty: facultyId })
      .populate('subject', 'name code semester credits')
      .populate('classDivision', 'name code semester academicYear')
      .populate('records.student', 'fullName email studentId avatar')
      .sort({ date: -1, startTime: -1 })
      .limit(50)
      .lean();

    return res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};
