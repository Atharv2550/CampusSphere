import mongoose from 'mongoose';

const timetableEntrySchema = new mongoose.Schema(
  {
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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: [true, 'Day of week is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
      trim: true,
    },
    room: {
      type: String,
      required: [true, 'Room or laboratory location is required'],
      trim: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: ['Theory', 'Practical', 'Laboratory', 'Tutorial'],
      default: 'Theory',
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveUntil: {
      type: Date,
      default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // ~6 months
    },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Cancelled', 'Archived'],
      default: 'Published',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes for conflict queries and lookups
timetableEntrySchema.index({ faculty: 1, dayOfWeek: 1, status: 1 });
timetableEntrySchema.index({ room: 1, dayOfWeek: 1, status: 1 });
timetableEntrySchema.index({ classDivision: 1, dayOfWeek: 1, status: 1 });

export const TimetableEntry = mongoose.model('TimetableEntry', timetableEntrySchema);
