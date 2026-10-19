import { Subject } from '../models/Subject.js';
import { ClassDivision } from '../models/ClassDivision.js';
import { TimetableEntry } from '../models/TimetableEntry.js';
import { User } from '../models/User.js';

// GET /api/subjects
export const getSubjects = async (req, res, next) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);

    const subjects = await Subject.find(filter)
      .populate('department', 'name code')
      .sort({ code: 1 });

    return res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    next(error);
  }
};

// GET /api/subjects/my (Faculty only)
export const getMyAssignedSubjects = async (req, res, next) => {
  try {
    const facultyId = req.user._id;

    // Find all timetable entries for this faculty
    const entries = await TimetableEntry.find({
      faculty: facultyId,
      status: 'Published',
    })
      .populate('subject')
      .populate('classDivision')
      .populate('department', 'name code');

    // Aggregate by Subject & Class combination
    const map = new Map();

    for (const entry of entries) {
      if (!entry.subject || !entry.classDivision) continue;

      const key = `${entry.subject._id.toString()}-${entry.classDivision._id.toString()}`;
      if (!map.has(key)) {
        map.set(key, {
          subject: entry.subject,
          classDivision: entry.classDivision,
          department: entry.department,
          rooms: new Set([entry.room]),
          weeklySessions: 1,
          activityTypes: new Set([entry.activityType]),
          scheduleSlots: [
            {
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
              room: entry.room,
              activityType: entry.activityType,
            },
          ],
        });
      } else {
        const item = map.get(key);
        item.rooms.add(entry.room);
        item.weeklySessions += 1;
        item.activityTypes.add(entry.activityType);
        item.scheduleSlots.push({
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room,
          activityType: entry.activityType,
        });
      }
    }

    const assigned = Array.from(map.values()).map((item) => ({
      ...item,
      rooms: Array.from(item.rooms),
      activityTypes: Array.from(item.activityTypes),
    }));

    return res.json({ success: true, count: assigned.length, data: assigned });
  } catch (error) {
    next(error);
  }
};

// POST /api/subjects (Admin only)
export const createSubject = async (req, res, next) => {
  try {
    const { name, code, department, semester, academicYear, credits, lectureHoursPerWeek, description } = req.body;

    const existing = await Subject.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Subject code ${code} already exists.` });
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase().trim(),
      department,
      semester,
      academicYear,
      credits: credits || 3,
      lectureHoursPerWeek: lectureHoursPerWeek || 3,
      description,
    });

    const populated = await Subject.findById(subject._id).populate('department', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/classes
export const getClasses = async (req, res, next) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);

    const classes = await ClassDivision.find(filter)
      .populate('department', 'name code')
      .sort({ code: 1 });

    return res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    next(error);
  }
};

// POST /api/classes (Admin only)
export const createClass = async (req, res, next) => {
  try {
    const { name, code, department, semester, academicYear, room, studentCount } = req.body;

    const existing = await ClassDivision.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Class code ${code} already exists.` });
    }

    const newClass = await ClassDivision.create({
      name,
      code: code.toUpperCase().trim(),
      department,
      semester,
      academicYear,
      room,
      studentCount: studentCount || 0,
    });

    const populated = await ClassDivision.findById(newClass._id).populate('department', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Class division created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/classes/:id/students
export const getClassStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classDiv = await ClassDivision.findById(id).populate('department');

    if (!classDiv) {
      return res.status(404).json({ success: false, message: 'Class division not found.' });
    }

    // Role check: Admin or Faculty assigned to this class
    if (req.user.role === 'faculty') {
      const isAssigned = await TimetableEntry.exists({
        faculty: req.user._id,
        classDivision: id,
        status: 'Published',
      });

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: You are not assigned to teach this class division.',
        });
      }
    }

    // If students are populated directly, return them, else find students in same department & semester
    let students = [];
    if (classDiv.students && classDiv.students.length > 0) {
      students = await User.find({ _id: { $in: classDiv.students } })
        .select('fullName email studentId department academicYear avatar')
        .sort({ fullName: 1 });
    } else {
      // Fallback: fetch student users matching department
      students = await User.find({
        role: 'student',
        department: classDiv.department?._id || classDiv.department,
      })
        .select('fullName email studentId department academicYear avatar')
        .limit(classDiv.studentCount || 35)
        .sort({ fullName: 1 });
    }

    return res.json({
      success: true,
      classDivision: {
        _id: classDiv._id,
        name: classDiv.name,
        code: classDiv.code,
        semester: classDiv.semester,
        academicYear: classDiv.academicYear,
      },
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};
