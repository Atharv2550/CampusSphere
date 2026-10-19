import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['registered', 'waitlisted', 'cancelled', 'attended', 'no-show'],
      default: 'registered',
      index: true,
    },
    waitlistPosition: {
      type: Number,
      default: 0,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    feedbackRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

export const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);
