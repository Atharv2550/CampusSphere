import mongoose from 'mongoose';

const classDivisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class or division name is required'],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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
    room: {
      type: String,
      default: '',
    },
    studentCount: {
      type: Number,
      default: 0,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

classDivisionSchema.index({ department: 1, semester: 1 });

export const ClassDivision = mongoose.model('ClassDivision', classDivisionSchema);
