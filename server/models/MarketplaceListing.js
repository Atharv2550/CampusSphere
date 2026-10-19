import mongoose from 'mongoose';

const marketplaceListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: [
        'Textbooks',
        'Calculators & Tools',
        'Lab Coats & Equipment',
        'Stationery & Drafting',
        'Electronics & Gadgets',
        'Dorm & Daily Essentials',
        'Notes & Course Materials',
        'Other',
      ],
      required: true,
      index: true,
    },
    condition: {
      type: String,
      enum: ['Brand New', 'Like New', 'Gently Used', 'Fair'],
      default: 'Gently Used',
    },
    listingType: {
      type: String,
      enum: ['Sell', 'Exchange', 'Free Giveaway'],
      default: 'Sell',
      index: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    exchangePreference: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Unavailable', 'Removed'],
      default: 'Available',
      index: true,
    },
    bookmarkedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isFlagged: {
      type: Boolean,
      default: false,
    },
    moderationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

marketplaceListingSchema.index({ title: 'text', description: 'text' });

export const MarketplaceListing = mongoose.model('MarketplaceListing', marketplaceListingSchema);
