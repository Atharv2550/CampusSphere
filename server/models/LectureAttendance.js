import mongoose from 'mongoose';

const studentRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      default: 'Present',
      required: true,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const editHistorySchema = new mongoose.Schema(
  {
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modifiedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: 'Attendance correction',
      trim: true,
    },
    changes: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        previousStatus: String,
        newStatus: String,
      },
    ],
  },
  { _id: true }
);

const lectureAttendanceSchema = new mongoose.Schema(
  {
    timetableEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimetableEntry',
      default: null,
      index: true,
    },
    dutyAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DutyAssignment',
      default: null,
      index: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty member is required'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
      index: true,
    },
    classDivision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassDivision',
      required: [true, 'Class division is required'],
      index: true,
    },
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true,
      index: true,
    },
    semester: {
      type: Number,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Lecture date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Lecture topic or syllabus unit is required'],
      trim: true,
    },
    sessionStatus: {
      type: String,
      enum: ['Submitted', 'Corrected', 'Cancelled'],
      default: 'Submitted',
      index: true,
    },
    records: [studentRecordSchema],
    summary: {
      totalStudents: { type: Number, default: 0 },
      presentCount: { type: Number, default: 0 },
      absentCount: { type: Number, default: 0 },
      lateCount: { type: Number, default: 0 },
      attendanceRate: { type: Number, default: 0 }, // percentage
    },
    editHistory: [editHistorySchema],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring only one attendance session per faculty, subject, class, date, and startTime
lectureAttendanceSchema.index(
  { faculty: 1, subject: 1, classDivision: 1, date: 1, startTime: 1 },
  { unique: true }
);

// Additional query performance indexes
lectureAttendanceSchema.index({ faculty: 1, date: -1 });
lectureAttendanceSchema.index({ classDivision: 1, date: -1 });
lectureAttendanceSchema.index({ subject: 1, date: -1 });
lectureAttendanceSchema.index({ 'records.student': 1 });

export const LectureAttendance = mongoose.model('LectureAttendance', lectureAttendanceSchema);
