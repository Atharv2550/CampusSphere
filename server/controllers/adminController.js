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
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
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

    // Safety: protect the last remaining active administrator
    if (user.role === 'admin' && (status === 'suspended' || (role && role !== 'admin'))) {
      const activeAdminsCount = await User.countDocuments({ role: 'admin', status: 'active' });
      if (activeAdminsCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied: Cannot deactivate or demote the last remaining active administrator.',
        });
      }
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

export const createFaculty = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      employeeId,
      department,
      designation,
      phoneNumber,
      status = 'active',
      password,
    } = req.body;

    // Validate required fields
    if (!fullName?.trim() || !email?.trim() || !employeeId?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, official college email, employee ID, and initial password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Initial password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanEmployeeId = employeeId.toUpperCase().trim();

    // Campus email domain validation if configured
    if (process.env.REQUIRE_CAMPUS_EMAIL === 'true') {
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'campussphere.edu';
      if (!cleanEmail.endsWith(`@${allowedDomain}`)) {
        return res.status(400).json({
          success: false,
          message: `Official faculty email must end with @${allowedDomain}`,
        });
      }
    }

    // Check unique email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: `An account with email "${cleanEmail}" already exists.`,
      });
    }

    // Check unique employeeId
    const existingEmpId = await User.findOne({ employeeId: cleanEmployeeId });
    if (existingEmpId) {
      return res.status(409).json({
        success: false,
        message: `A faculty member with Employee ID "${cleanEmployeeId}" already exists.`,
      });
    }

    // Role is strictly enforced on server as 'faculty'
    const newFaculty = new User({
      fullName: fullName.trim(),
      email: cleanEmail,
      employeeId: cleanEmployeeId,
      password, // Pre-save hook securely hashes with bcrypt
      role: 'faculty',
      department: department || null,
      designation: designation?.trim() || 'Assistant Professor',
      phoneNumber: phoneNumber?.trim() || '',
      academicYear: 'Faculty/Staff',
      status: ['active', 'suspended', 'pending'].includes(status) ? status : 'active',
    });

    await newFaculty.save();
    await newFaculty.populate('department', 'name code');

    // Audit log
    await logAuditEvent({
      user: req.user,
      action: 'FACULTY_ACCOUNT_CREATED',
      targetType: 'User',
      targetId: newFaculty._id,
      details: {
        fullName: newFaculty.fullName,
        email: newFaculty.email,
        employeeId: newFaculty.employeeId,
        department: newFaculty.department?.name,
        designation: newFaculty.designation,
        status: newFaculty.status,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Faculty account for ${newFaculty.fullName} (${newFaculty.employeeId}) created successfully.`,
      data: {
        _id: newFaculty._id,
        fullName: newFaculty.fullName,
        email: newFaculty.email,
        employeeId: newFaculty.employeeId,
        role: newFaculty.role,
        department: newFaculty.department,
        designation: newFaculty.designation,
        phoneNumber: newFaculty.phoneNumber,
        status: newFaculty.status,
        academicYear: newFaculty.academicYear,
        createdAt: newFaculty.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      employeeId,
      department,
      designation,
      phoneNumber,
      status,
      password,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Faculty user not found.' });
    }

    // Safety: prevent suspending oneself
    if (user._id.toString() === req.user._id.toString() && status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot suspend their own account.',
      });
    }

    // Safety: protect last active admin
    if (user.role === 'admin' && status === 'suspended') {
      const activeAdminsCount = await User.countDocuments({ role: 'admin', status: 'active' });
      if (activeAdminsCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied: Cannot deactivate the last remaining active administrator.',
        });
      }
    }

    // Check unique email if changing email
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: `An account with email "${cleanEmail}" already exists.`,
          });
        }
        user.email = cleanEmail;
      }
    }

    // Check unique employeeId if changing
    if (employeeId) {
      const cleanEmpId = employeeId.toUpperCase().trim();
      if (cleanEmpId !== user.employeeId) {
        const existingEmp = await User.findOne({ employeeId: cleanEmpId, _id: { $ne: user._id } });
        if (existingEmp) {
          return res.status(409).json({
            success: false,
            message: `A faculty member with Employee ID "${cleanEmpId}" already exists.`,
          });
        }
        user.employeeId = cleanEmpId;
      }
    }

    if (fullName?.trim()) user.fullName = fullName.trim();
    if (department !== undefined) user.department = department || null;
    if (designation !== undefined) user.designation = designation.trim();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    if (status && ['active', 'suspended', 'pending'].includes(status)) user.status = status;

    // Password reset by admin
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        });
      }
      user.password = password; // Will be hashed by pre('save') hook
    }

    await user.save();
    await user.populate('department', 'name code');

    // Audit log
    await logAuditEvent({
      user: req.user,
      action: 'FACULTY_ACCOUNT_UPDATED',
      targetType: 'User',
      targetId: user._id,
      details: {
        fullName: user.fullName,
        email: user.email,
        employeeId: user.employeeId,
        department: user.department?.name,
        designation: user.designation,
        status: user.status,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Faculty member ${user.fullName} updated successfully.`,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        department: user.department,
        designation: user.designation,
        phoneNumber: user.phoneNumber,
        status: user.status,
        academicYear: user.academicYear,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
