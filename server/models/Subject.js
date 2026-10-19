import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    academicYear: {
      type: String,
      default: '2026-2027',
    },
    credits: {
      type: Number,
      default: 3,
    },
    lectureHoursPerWeek: {
      type: Number,
      default: 3,
    },
    description: {
      type: String,
      default: '',
    },
    syllabusLink: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ department: 1, semester: 1 });

export const Subject = mongoose.model('Subject', subjectSchema);
