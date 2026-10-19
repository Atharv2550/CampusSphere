import { LostFoundItem } from '../models/LostFoundItem.js';
import { LostFoundClaim } from '../models/LostFoundClaim.js';
import { findPotentialMatches } from '../services/matchingService.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getItems = async (req, res, next) => {
  try {
    const { type, category, status, search, location, page = 1, limit = 12 } = req.query;

    const filter = { isFlagged: false };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['Open', 'Potential Match', 'Claim Pending'] };
    }
    if (location) filter.location = { $regex: location, $options: 'i' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await LostFoundItem.countDocuments(filter);
    const items = await LostFoundItem.find(filter)
      .populate('reporter', 'fullName email avatar department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: items,
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

export const getItemById = async (req, res, next) => {
  try {
    const item = await LostFoundItem.findById(req.params.id)
      .populate('reporter', 'fullName email avatar department studentId')
      .populate('resolvedClaim');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Fetch potential matches using our transparent deterministic algorithm
    const potentialMatches = await findPotentialMatches(item);

    // Fetch claims if user is reporter or admin
    let claims = [];
    const isReporterOrAdmin =
      req.user &&
      (req.user.role === 'admin' || item.reporter._id.toString() === req.user._id.toString());

    if (isReporterOrAdmin) {
      claims = await LostFoundClaim.find({ item: item._id })
        .populate('claimant', 'fullName email department avatar phoneNumber')
        .sort({ createdAt: -1 });
    } else if (req.user) {
      // Claimant can only see their own claim
      claims = await LostFoundClaim.find({ item: item._id, claimant: req.user._id })
        .populate('claimant', 'fullName email avatar');
    }

    res.status(200).json({
      success: true,
      data: {
        item,
        potentialMatches,
        claims,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req, res, next) => {
  try {
    const { type, title, category, description, color, dateOccurred, location, images } = req.body;

    if (!type || !title || !category || !description || !dateOccurred || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields including type, title, category, date, and location.',
      });
    }

    const item = await LostFoundItem.create({
      type,
      title,
      category,
      description,
      color: color || '',
      dateOccurred,
      location,
      images: Array.isArray(images) ? images : [],
      reporter: req.user._id,
      status: 'Open',
    });

    // Check for potential matches immediately and alert reporter if high match found!
    const matches = await findPotentialMatches(item, 1);
    if (matches.length > 0 && matches[0].matchPercentage >= 65) {
      item.status = 'Potential Match';
      await item.save();

      await createNotification({
        recipient: req.user._id,
        title: '🔍 Potential Match Found!',
        message: `We found a ${matches[0].matchPercentage}% match for your ${item.type} item: "${matches[0].item.title}". Check details now.`,
        type: 'lost_found',
        relatedId: item._id,
        actionUrl: `/lost-found/${item._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: `Report for ${type} item created successfully.`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const submitClaim = async (req, res, next) => {
  try {
    const { verificationDetails, contactNumber } = req.body;
    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.type !== 'found') {
      return res.status(400).json({
        success: false,
        message: 'Claims can only be filed on found items to verify ownership.',
      });
    }

    if (item.reporter.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit a claim for an item you reported.',
      });
    }

    if (!verificationDetails || verificationDetails.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide detailed private verification proof (e.g. markings, lock wallpaper, serial).',
      });
    }

    const existingClaim = await LostFoundClaim.findOne({
      item: item._id,
      claimant: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a claim for this item.',
      });
    }

    const claim = await LostFoundClaim.create({
      item: item._id,
      claimant: req.user._id,
      verificationDetails: verificationDetails.trim(),
      contactNumber: contactNumber || '',
      status: 'pending',
    });

    item.status = 'Claim Pending';
    await item.save();

    // Notify item reporter
    await createNotification({
      recipient: item.reporter,
      title: '📦 New Ownership Claim Filed',
      message: `${req.user.fullName} has filed an ownership claim on "${item.title}". Review private proof to verify.`,
      type: 'claim',
      relatedId: item._id,
      actionUrl: `/lost-found/${item._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully. The reporter will review your private verification details.',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewClaim = async (req, res, next) => {
  try {
    const { status, reviewerNotes } = req.body; // 'approved' or 'rejected'
    const claim = await LostFoundClaim.findById(req.params.claimId).populate('item');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const item = await LostFoundItem.findById(claim.item._id);

    // Only reporter or admin can review
    if (req.user.role !== 'admin' && item.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the item reporter or campus admin can review claims.',
      });
    }

    claim.status = status;
    claim.reviewer = req.user._id;
    claim.reviewerNotes = reviewerNotes || '';
    if (status === 'approved') {
      claim.handoverDate = new Date();
      item.status = 'Resolved';
      item.resolvedClaim = claim._id;
      await item.save();
    }
    await claim.save();

    // Notify claimant
    await createNotification({
      recipient: claim.claimant,
      title: status === 'approved' ? '✅ Item Claim Approved!' : '❌ Item Claim Rejected',
      message:
        status === 'approved'
          ? `Your claim on "${item.title}" was approved! Contact the finder to coordinate handover.`
          : `Your claim on "${item.title}" was not approved: ${reviewerNotes || 'Insufficient proof provided.'}`,
      type: 'claim',
      relatedId: item._id,
      actionUrl: `/lost-found/${item._id}`,
    });

    res.status(200).json({
      success: true,
      message: `Claim ${status} successfully.`,
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

export const flagItem = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.isFlagged = true;
    item.moderationReason = reason || 'Reported as suspicious or inappropriate content.';
    await item.save();

    await logAuditEvent({
      user: req.user,
      action: 'LOST_FOUND_FLAGGED',
      targetType: 'LostFoundItem',
      targetId: item._id,
      details: { reason },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Item has been flagged for campus moderation.',
    });
  } catch (error) {
    next(error);
  }
};
