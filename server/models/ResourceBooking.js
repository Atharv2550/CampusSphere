import mongoose from 'mongoose';

const resourceBookingSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusResource',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      required: [true, 'Booking purpose is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Booking date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'], // e.g. "10:00"
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'], // e.g. "12:00"
    },
    expectedAttendees: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'],
      default: 'Pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

resourceBookingSchema.index({ resource: 1, date: 1, status: 1 });

export const ResourceBooking = mongoose.model('ResourceBooking', resourceBookingSchema);
