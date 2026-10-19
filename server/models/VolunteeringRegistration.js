import mongoose from 'mongoose';

const volunteeringRegistrationSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VolunteeringActivity',
      required: true,
      index: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled', 'no-show'],
      default: 'registered',
      index: true,
    },
    verifiedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateCode: {
      type: String,
      default: '',
    },
    issuedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

volunteeringRegistrationSchema.index({ activity: 1, volunteer: 1 }, { unique: true });

export const VolunteeringRegistration = mongoose.model('VolunteeringRegistration', volunteeringRegistrationSchema);
