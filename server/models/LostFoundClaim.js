import mongoose from 'mongoose';

const lostFoundClaimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostFoundItem',
      required: true,
      index: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    verificationDetails: {
      type: String,
      required: [true, 'Private proof of ownership is required'],
    },
    contactNumber: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'handover_completed'],
      default: 'pending',
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewerNotes: {
      type: String,
      default: '',
    },
    handoverDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const LostFoundClaim = mongoose.model('LostFoundClaim', lostFoundClaimSchema);
