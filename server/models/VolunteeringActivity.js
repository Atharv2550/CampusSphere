import mongoose from 'mongoose';

const volunteeringActivitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
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
    venue: {
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
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    allocatedHours: {
      type: Number,
      required: true,
      min: 0.5,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentRegisteredCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Open', 'Full', 'Cancelled', 'Completed'],
      default: 'Open',
      index: true,
    },
    banner: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const VolunteeringActivity = mongoose.model('VolunteeringActivity', volunteeringActivitySchema);
