import { MarketplaceListing } from '../models/MarketplaceListing.js';
import { MarketplaceRequest } from '../models/MarketplaceRequest.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getListings = async (req, res, next) => {
  try {
    const { category, listingType, condition, maxPrice, search, status, page = 1, limit = 12 } = req.query;

    const filter = { isFlagged: false };
    if (category) filter.category = category;
    if (listingType) filter.listingType = listingType;
    if (condition) filter.condition = condition;
    if (maxPrice) filter.price = { $lte: parseFloat(maxPrice) };

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['Available', 'Reserved'] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await MarketplaceListing.countDocuments(filter);
    const listings = await MarketplaceListing.find(filter)
      .populate('seller', 'fullName email avatar department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: listings,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getListingById = async (req, res, next) => {
  try {
    const listing = await MarketplaceListing.findById(req.params.id)
      .populate('seller', 'fullName email avatar department studentId');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    let userRequest = null;
    let sellerRequests = [];

    if (req.user) {
      if (listing.seller._id.toString() === req.user._id.toString() || req.user.role === 'admin') {
        sellerRequests = await MarketplaceRequest.find({ listing: listing._id })
          .populate('buyer', 'fullName email avatar department phoneNumber')
          .sort({ createdAt: -1 });
      } else {
        userRequest = await MarketplaceRequest.findOne({
          listing: listing._id,
          buyer: req.user._id,
        });
      }
    }

    const isBookmarked = req.user ? listing.bookmarkedBy.some((id) => id.toString() === req.user._id.toString()) : false;

    res.status(200).json({
      success: true,
      data: {
        ...listing.toObject(),
        isBookmarked,
        userRequest,
        sellerRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createListing = async (req, res, next) => {
  try {
    const { title, description, category, condition, listingType, price, exchangePreference, images } = req.body;

    if (!title || !description || !category || !listingType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, and listing type.',
      });
    }

    const listing = await MarketplaceListing.create({
      title,
      description,
      category,
      condition: condition || 'Gently Used',
      listingType,
      price: listingType === 'Sell' ? parseFloat(price) || 0 : 0,
      exchangePreference: exchangePreference || '',
      images: Array.isArray(images) ? images : [],
      seller: req.user._id,
      status: 'Available',
    });

    await logAuditEvent({
      user: req.user,
      action: 'MARKETPLACE_LISTING_CREATE',
      targetType: 'MarketplaceListing',
      targetId: listing._id,
      details: { title: listing.title, category: listing.category },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Item listed successfully on Campus Marketplace.',
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleBookmark = async (req, res, next) => {
  try {
    const listing = await MarketplaceListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const index = listing.bookmarkedBy.indexOf(req.user._id);
    let bookmarked = false;
    if (index > -1) {
      listing.bookmarkedBy.splice(index, 1);
    } else {
      listing.bookmarkedBy.push(req.user._id);
      bookmarked = true;
    }

    await listing.save();

    res.status(200).json({
      success: true,
      bookmarked,
      message: bookmarked ? 'Listing saved to bookmarks.' : 'Listing removed from bookmarks.',
    });
  } catch (error) {
    next(error);
  }
};

export const submitRequest = async (req, res, next) => {
  try {
    const { offerType, offeredPrice, offeredItemDescription, message, handoverLocation } = req.body;
    const listing = await MarketplaceListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit an exchange or purchase request on your own listing.',
      });
    }

    if (listing.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Listing is currently ${listing.status.toLowerCase()}.`,
      });
    }

    const existingReq = await MarketplaceRequest.findOne({
      listing: listing._id,
      buyer: req.user._id,
      status: { $in: ['Pending', 'Accepted'] },
    });

    if (existingReq) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active request pending for this listing.',
      });
    }

    const request = await MarketplaceRequest.create({
      listing: listing._id,
      buyer: req.user._id,
      offerType: offerType || 'Buy',
      offeredPrice: offeredPrice ? parseFloat(offeredPrice) : listing.price,
      offeredItemDescription: offeredItemDescription || '',
      message: message || '',
      handoverLocation: handoverLocation || 'Campus Library Foyer',
      status: 'Pending',
    });

    await createNotification({
      recipient: listing.seller,
      title: '🛒 New Marketplace Request',
      message: `${req.user.fullName} is interested in your listing "${listing.title}". Review their proposed offer.`,
      type: 'marketplace',
      relatedId: listing._id,
      actionUrl: `/marketplace/${listing._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Request sent to seller successfully.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, handoverNotes, handoverLocation, handoverTime } = req.body;
    const request = await MarketplaceRequest.findById(req.params.requestId).populate('listing');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const listing = await MarketplaceListing.findById(request.listing._id);

    // Only seller or buyer (for cancellation) or admin
    const isSeller = listing.seller.toString() === req.user._id.toString();
    const isBuyer = request.buyer.toString() === req.user._id.toString();

    if (!isSeller && !isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (status === 'Cancelled' && !isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the buyer can cancel their request.' });
    }

    request.status = status;
    if (handoverNotes !== undefined) request.handoverNotes = handoverNotes;
    if (handoverLocation !== undefined) request.handoverLocation = handoverLocation;
    if (handoverTime !== undefined) request.handoverTime = handoverTime;

    if (status === 'Accepted') {
      listing.status = 'Reserved';
      await listing.save();
    } else if (status === 'Completed') {
      request.isHandoverCompleted = true;
      listing.status = 'Unavailable';
      await listing.save();
    } else if (status === 'Rejected' || status === 'Cancelled') {
      if (listing.status === 'Reserved') {
        listing.status = 'Available';
        await listing.save();
      }
    }

    await request.save();

    // Notify counterpart
    const targetRecipient = isSeller ? request.buyer : listing.seller;
    await createNotification({
      recipient: targetRecipient,
      title: `Marketplace Request ${status}`,
      message: `Your request regarding "${listing.title}" is now marked as ${status}.`,
      type: 'marketplace',
      relatedId: listing._id,
      actionUrl: `/marketplace/${listing._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Request status updated to ${status}.`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const flagListing = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const listing = await MarketplaceListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    listing.isFlagged = true;
    listing.moderationReason = reason || 'Prohibited item or terms violation reported.';
    await listing.save();

    await logAuditEvent({
      user: req.user,
      action: 'MARKETPLACE_LISTING_FLAGGED',
      targetType: 'MarketplaceListing',
      targetId: listing._id,
      details: { reason },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Listing flagged for administrator review.',
    });
  } catch (error) {
    next(error);
  }
};
