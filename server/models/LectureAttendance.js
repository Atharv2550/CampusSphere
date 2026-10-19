import mongoose from 'mongoose';

const lectureAttendanceSchema = new mongoose.Schema(
  {
    timetableEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimetableEntry',
      default: null,
    },
    dutyAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DutyAssignment',
      default: null,
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
    date: {
      type: Date,
      required: [true, 'Lecture date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    topic: {
      type: String,
      required: [true, 'Lecture topic or syllabus unit is required'],
      trim: true,
    },
    records: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['Present', 'Absent', 'Late'],
          default: 'Present',
        },
        remarks: {
          type: String,
          default: '',
        },
      },
    ],
    summary: {
      totalStudents: { type: Number, default: 0 },
      presentCount: { type: Number, default: 0 },
      absentCount: { type: Number, default: 0 },
      lateCount: { type: Number, default: 0 },
      attendanceRate: { type: Number, default: 0 }, // percentage
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records for the exact same lecture slot
lectureAttendanceSchema.index(
  { faculty: 1, subject: 1, classDivision: 1, date: 1, startTime: 1 },
  { unique: true }
);

export const LectureAttendance = mongoose.model('LectureAttendance', lectureAttendanceSchema);
