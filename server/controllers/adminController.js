import { User } from '../models/User.js';
import { MarketplaceListing } from '../models/MarketplaceListing.js';
import { LostFoundItem } from '../models/LostFoundItem.js';
import { AuditLog } from '../models/AuditLog.js';
import { PlatformSetting } from '../models/PlatformSetting.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, status, department, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (department) filter.department = department;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('department', 'name code')
      .populate('assignedClub', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: users,
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

export const updateUserStatus = async (req, res, next) => {
  try {
    const { status, role, assignedClub } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safety: prevent suspending oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Administrators cannot change their own status or role.' });
    }

    if (status) user.status = status;
    if (role) user.role = role;
    if (assignedClub !== undefined) user.assignedClub = assignedClub || null;

    await user.save();

    await logAuditEvent({
      user: req.user,
      action: 'USER_STATUS_UPDATED',
      targetType: 'User',
      targetId: user._id,
      details: { updatedStatus: status, updatedRole: role },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.fullName} updated successfully.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getFlaggedContent = async (req, res, next) => {
  try {
    const flaggedListings = await MarketplaceListing.find({ isFlagged: true })
      .populate('seller', 'fullName email')
      .sort({ updatedAt: -1 });

    const flaggedLostFound = await LostFoundItem.find({ isFlagged: true })
      .populate('reporter', 'fullName email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        flaggedListings,
        flaggedLostFound,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const moderateContent = async (req, res, next) => {
  try {
    const { contentType, contentId, action } = req.body; // action: 'dismiss' or 'remove'

    if (contentType === 'marketplace') {
      const listing = await MarketplaceListing.findById(contentId);
      if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

      if (action === 'remove') {
        listing.status = 'Removed';
        listing.isFlagged = false;
      } else {
        listing.isFlagged = false;
        listing.moderationReason = '';
      }
      await listing.save();
    } else if (contentType === 'lostfound') {
      const item = await LostFoundItem.findById(contentId);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      if (action === 'remove') {
        item.status = 'Closed';
        item.isFlagged = false;
      } else {
        item.isFlagged = false;
        item.moderationReason = '';
      }
      await item.save();
    }

    await logAuditEvent({
      user: req.user,
      action: 'CONTENT_MODERATION',
      targetType: contentType,
      targetId: contentId,
      details: { action },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Content successfully moderated: ${action}.`,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, targetType, page = 1, limit = 25 } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: logs,
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

export const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await PlatformSetting.find();
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSetting = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;

    const setting = await PlatformSetting.findOneAndUpdate(
      { key },
      { value, description, updatedBy: req.user._id },
      { upsert: true, new: true }
    );

    await logAuditEvent({
      user: req.user,
      action: 'PLATFORM_SETTING_UPDATE',
      targetType: 'PlatformSetting',
      targetId: setting._id,
      details: { key, value },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Platform setting "${key}" updated.`,
      data: setting,
    });
  } catch (error) {
    next(error);
  }
};
