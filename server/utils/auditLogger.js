import { AuditLog } from '../models/AuditLog.js';

export const logAuditEvent = async ({ user, action, targetType, targetId = null, details = {}, req = null }) => {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '';
    const userAgent = req?.headers?.['user-agent'] || '';

    await AuditLog.create({
      user: user?._id || user?.id || null,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('[Audit Log Error]', error);
  }
};
