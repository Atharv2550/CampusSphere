import mongoose from 'mongoose';

const marketplaceRequestSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceListing',
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    offerType: {
      type: String,
      enum: ['Buy', 'Exchange', 'Claim Free'],
      default: 'Buy',
    },
    offeredPrice: {
      type: Number,
      default: 0,
    },
    offeredItemDescription: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'],
      default: 'Pending',
      index: true,
    },
    handoverLocation: {
      type: String,
      default: 'Campus Library Foyer',
    },
    handoverTime: {
      type: Date,
      default: null,
    },
    handoverNotes: {
      type: String,
      default: '',
    },
    isHandoverCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const MarketplaceRequest = mongoose.model('MarketplaceRequest', marketplaceRequestSchema);
