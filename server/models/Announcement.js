import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Department', 'Club', 'Role'],
      default: 'All',
      index: true,
    },
    targetDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    targetClub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: null,
    },
    targetRole: {
      type: String,
      enum: ['student', 'faculty', 'coordinator', 'resource_manager', 'admin'],
      default: null,
    },
    category: {
      type: String,
      enum: ['General', 'Academic', 'Event', 'Emergency', 'Maintenance', 'Opportunity'],
      default: 'General',
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
