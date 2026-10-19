import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Club code/handle is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Academic', 'Social Service', 'Arts & Media', 'Other'],
      default: 'Technical',
      index: true,
    },
    logo: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    coordinators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    committeeMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        roleTitle: {
          type: String,
          default: 'Core Member',
        },
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Suspended'],
      default: 'Active',
      index: true,
    },
    meetingInfo: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Club = mongoose.model('Club', clubSchema);
