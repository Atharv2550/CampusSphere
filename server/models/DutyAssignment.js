import mongoose from 'mongoose';

const dutyAssignmentSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned faculty member is required'],
      index: true,
    },
    originalFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'Substitution',
        'Examination Invigilation',
        'Department Meeting',
        'Event Supervision',
        'Committee Duty',
      ],
      required: [true, 'Duty type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Duty title is required'],
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    classDivision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassDivision',
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'Duty date is required'],
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
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Assigned', 'Acknowledged', 'Completed', 'Cancelled'],
      default: 'Assigned',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

dutyAssignmentSchema.index({ faculty: 1, date: 1, status: 1 });

export const DutyAssignment = mongoose.model('DutyAssignment', dutyAssignmentSchema);
