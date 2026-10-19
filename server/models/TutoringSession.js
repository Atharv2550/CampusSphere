import mongoose from 'mongoose';

const tutoringSessionSchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true, // e.g. "14:00"
    },
    endTime: {
      type: String,
      required: true, // e.g. "15:00"
    },
    meetingMode: {
      type: String,
      enum: ['In-person', 'Online', 'Hybrid'],
      default: 'In-person',
    },
    locationOrLink: {
      type: String,
      default: 'Library Quiet Study Room 3',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Requested', 'Accepted', 'Rejected', 'Cancelled', 'Completed', 'No-Show'],
      default: 'Requested',
      index: true,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    hasReview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

tutoringSessionSchema.index({ tutor: 1, date: 1, startTime: 1 });

export const TutoringSession = mongoose.model('TutoringSession', tutoringSessionSchema);
