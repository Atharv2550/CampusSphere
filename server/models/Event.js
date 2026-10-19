import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    category: {
      type: String,
      enum: ['Workshop', 'Seminar', 'Hackathon', 'Cultural', 'Sports', 'Technical', 'Career', 'Social', 'Other'],
      default: 'Technical',
      index: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: null,
    },
    banner: {
      type: String,
      default: '',
    },
    venue: {
      type: String,
      required: [true, 'Venue or online link is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date and time is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date and time is required'],
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    waitlistCapacity: {
      type: Number,
      default: 50,
      min: 0,
    },
    currentRegisteredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentWaitlistCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Full', 'Cancelled', 'Completed', 'Archived'],
      default: 'Published',
      index: true,
    },
    checkInCode: {
      type: String,
      default: () => Math.random().toString(36).substring(2, 8).toUpperCase(),
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ title: 'text', description: 'text', venue: 'text' });
eventSchema.index({ status: 1, startDate: 1 });

export const Event = mongoose.model('Event', eventSchema);
