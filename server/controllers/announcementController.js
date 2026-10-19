import { Announcement } from '../models/Announcement.js';
import { User } from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getAnnouncements = async (req, res, next) => {
  try {
    const { category, isPinned, search } = req.query;

    const filter = {
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    };

    if (category) filter.category = category;
    if (isPinned !== undefined) filter.isPinned = isPinned === 'true';

    // Target audience scoping
    if (req.user) {
      const userDepartment = req.user.department?._id || req.user.department;
      const userClub = req.user.assignedClub?._id || req.user.assignedClub;

      filter.$and = [
        {
          $or: [
            { targetAudience: 'All' },
            { targetAudience: 'Role', targetRole: req.user.role },
            { targetAudience: 'Department', targetDepartment: userDepartment },
            { targetAudience: 'Club', targetClub: userClub },
          ],
        },
      ];
    } else {
      filter.targetAudience = 'All';
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const announcements = await Announcement.find(filter)
      .populate('author', 'fullName email avatar role')
      .populate('targetDepartment', 'name code')
      .populate('targetClub', 'name code')
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetAudience, targetDepartment, targetClub, targetRole, category, isPinned, expiresAt, attachments } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide announcement title and content.',
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      author: req.user._id,
      targetAudience: targetAudience || 'All',
      targetDepartment: targetDepartment || null,
      targetClub: targetClub || null,
      targetRole: targetRole || null,
      category: category || 'General',
      isPinned: Boolean(isPinned),
      expiresAt: expiresAt || null,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    await logAuditEvent({
      user: req.user,
      action: 'ANNOUNCEMENT_CREATE',
      targetType: 'Announcement',
      targetId: announcement._id,
      details: { title: announcement.title, targetAudience: announcement.targetAudience },
      req,
    });

    // Notify targeted users if high importance
    if (category === 'Emergency' || isPinned) {
      let recipientFilter = { status: 'active' };
      if (targetAudience === 'Department' && targetDepartment) {
        recipientFilter.department = targetDepartment;
      } else if (targetAudience === 'Role' && targetRole) {
        recipientFilter.role = targetRole;
      }

      const usersToNotify = await User.find(recipientFilter).select('_id');
      for (const u of usersToNotify.slice(0, 100)) {
        createNotification({
          recipient: u._id,
          title: `📢 Announcement: ${title}`,
          message: content.substring(0, 120) + (content.length > 120 ? '...' : ''),
          type: 'announcement',
          relatedId: announcement._id,
          actionUrl: '/announcements',
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (req.user.role !== 'admin' && announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Announcement deleted.',
    });
  } catch (error) {
    next(error);
  }
};
