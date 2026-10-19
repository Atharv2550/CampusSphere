import { Notification } from '../models/Notification.js';

let ioInstance = null;

export const initNotificationSocket = (io) => {
  ioInstance = io;
};

export const createNotification = async ({ recipient, title, message, type = 'system', relatedId = null, actionUrl = '' }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedId,
      actionUrl,
    });

    if (ioInstance) {
      // Emit to recipient's private room
      ioInstance.to(`user:${recipient.toString()}`).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service Error]', error);
  }
};
