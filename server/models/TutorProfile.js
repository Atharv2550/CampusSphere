import mongoose from 'mongoose';

const tutorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    subjects: {
      type: [String],
      required: [true, 'At least one subject is required'],
      index: true,
    },
    bio: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    meetingModes: {
      type: [String],
      enum: ['In-person', 'Online', 'Hybrid'],
      default: ['In-person', 'Online'],
    },
    availableSlots: [
      {
        dayOfWeek: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        startTime: {
          type: String,
          required: true, // e.g. "14:00"
        },
        endTime: {
          type: String,
          required: true, // e.g. "15:00"
        },
      },
    ],
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TutorProfile = mongoose.model('TutorProfile', tutorProfileSchema);
