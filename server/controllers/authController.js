import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword, department, academicYear, studentId, phoneNumber } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Configurable campus email check
    if (process.env.REQUIRE_CAMPUS_EMAIL === 'true') {
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'campussphere.edu';
      if (!email.toLowerCase().endsWith(`@${allowedDomain}`)) {
        return res.status(400).json({
          success: false,
          message: `Registration requires a valid campus email address ending with @${allowedDomain}`,
        });
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Never trust self-assigned privileged roles in public registration
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student', // Enforced default
      department: department || null,
      academicYear: academicYear || '1st Year',
      studentId: studentId || '',
      phoneNumber: phoneNumber || '',
    });

    const token = generateToken({ id: user._id, role: user.role });

    const populatedUser = await User.findById(user._id).populate('department');

    await logAuditEvent({
      user,
      action: 'USER_REGISTER',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email, role: user.role },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to CampusSphere.',
      data: {
        token,
        user: {
          id: populatedUser._id,
          fullName: populatedUser.fullName,
          email: populatedUser.email,
          role: populatedUser.role,
          department: populatedUser.department,
          academicYear: populatedUser.academicYear,
          avatar: populatedUser.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('department')
      .populate('assignedClub');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact campus administration.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken({ id: user._id, role: user.role });

    await logAuditEvent({
      user,
      action: 'USER_LOGIN',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          department: user.department,
          academicYear: user.academicYear,
          avatar: user.avatar,
          assignedClub: user.assignedClub,
          interests: user.interests,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department')
      .populate('assignedClub');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    // Always respond with success to prevent user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been dispatched.',
      });
    }

    const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset code generated. For local development demo, use code: ' + resetToken,
      resetCode: resetToken,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    const user = await User.findOne({
      email: email?.toLowerCase().trim(),
      resetPasswordToken: resetCode,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset code.',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};
