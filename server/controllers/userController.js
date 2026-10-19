import { User } from '../models/User.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, interests, academicYear, phoneNumber, studentId, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName) user.fullName = fullName.trim();
    if (bio !== undefined) user.bio = bio;
    if (interests !== undefined) user.interests = Array.isArray(interests) ? interests : [];
    if (academicYear) user.academicYear = academicYear;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (studentId !== undefined) user.studentId = studentId;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    const updated = await User.findById(user._id).populate('department').populate('assignedClub');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-resetPasswordToken -resetPasswordExpires')
      .populate('department')
      .populate('assignedClub');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
