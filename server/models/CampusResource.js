import mongoose from 'mongoose';

const campusResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['Room', 'Lab', 'Hall', 'Equipment', 'Sports Facility', 'Other'],
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Resource location is required'],
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    description: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    operatingHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '20:00' },
    },
    allowedRoles: {
      type: [String],
      enum: ['student', 'faculty', 'coordinator', 'resource_manager', 'admin'],
      default: ['student', 'faculty', 'coordinator', 'resource_manager', 'admin'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    isMaintenance: {
      type: Boolean,
      default: false,
    },
    maintenanceNotes: {
      type: String,
      default: '',
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

export const CampusResource = mongoose.model('CampusResource', campusResourceSchema);
