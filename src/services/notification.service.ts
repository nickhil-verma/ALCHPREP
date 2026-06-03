import { NotificationRepository } from '@/repositories/notification.repository';
import { DeviceTokenRepository } from '@/repositories/device-token.repository';
import { sendPushNotification } from '@/lib/firebase/messaging';
import { NotFoundError, ForbiddenError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';
import type { INotificationDocument } from '@/models/notification.model';
import type { NotificationType } from '@/types/notification.types';

class NotificationServiceClass {
  /**
   * Saves a notification to the DB and triggers a push alert to all active user devices
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<INotificationDocument> {
    logger.info(`Sending ${type} notification to user ${userId}`);

    // 1. Save to database history
    const notification = await NotificationRepository.create({
      user_id: userId,
      type,
      title,
      body,
      is_read: false,
      data: data || {},
    } as any);

    // 2. Query active device tokens
    const deviceTokens = await DeviceTokenRepository.findActiveTokensForUser(userId);
    const tokens = deviceTokens.map((dt) => dt.token);

    // 3. Dispatch push notification
    if (tokens.length > 0) {
      await sendPushNotification(tokens, title, body, data);
    } else {
      logger.debug(`No active push tokens found for user ${userId}. Saved to DB only.`);
    }

    return notification;
  }

  /**
   * Retrieves notifications history for a user
   */
  async getNotifications(userId: string, limit = 50): Promise<INotificationDocument[]> {
    return NotificationRepository.find(
      { user_id: userId },
      { sort: { created_at: -1 }, limit }
    );
  }

  /**
   * Marks a specific notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<INotificationDocument> {
    const notification = await NotificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification');
    }
    if (notification.user_id.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this notification');
    }

    const updated = await NotificationRepository.update(notificationId, { is_read: true });
    if (!updated) {
      throw new NotFoundError('Notification');
    }
    return updated;
  }

  /**
   * Marks all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    return NotificationRepository.markAllAsRead(userId);
  }
}

export const NotificationService = new NotificationServiceClass();
