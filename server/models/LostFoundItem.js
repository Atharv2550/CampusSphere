import mongoose from 'mongoose';

const lostFoundItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Report type (lost or found) is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Item name/title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Electronics',
        'Books & Notes',
        'ID Cards & Keys',
        'Clothing & Apparel',
        'Bags & Wallets',
        'Accessories & Jewellery',
        'Bottles & Containers',
        'Sports & Music Gear',
        'Other',
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    dateOccurred: {
      type: Date,
      required: [true, 'Approximate date is required'],
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location on campus is required'],
      trim: true,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Potential Match', 'Claim Pending', 'Resolved', 'Rejected', 'Closed'],
      default: 'Open',
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    moderationReason: {
      type: String,
      default: '',
    },
    resolvedClaim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostFoundClaim',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

lostFoundItemSchema.index({ title: 'text', description: 'text', location: 'text', color: 'text' });

export const LostFoundItem = mongoose.model('LostFoundItem', lostFoundItemSchema);
