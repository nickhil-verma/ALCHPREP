import { BaseRepository } from './base.repository';
import { Notification, INotificationDocument } from '@/models/notification.model';

class NotificationRepositoryClass extends BaseRepository<INotificationDocument> {
  constructor() {
    super(Notification);
  }

  async findByUser(userId: string, limit: number = 50): Promise<INotificationDocument[]> {
    return this.find(
      { user_id: userId },
      { sort: { created_at: -1 }, limit }
    );
  }

  async findUnread(userId: string): Promise<INotificationDocument[]> {
    return this.find(
      { user_id: userId, read: false },
      { sort: { created_at: -1 } }
    );
  }

  async markAsRead(notificationId: string): Promise<INotificationDocument | null> {
    return this.update(notificationId, { read: true });
  }

  async markAllAsRead(userId: string): Promise<number> {
    return this.updateMany(
      { user_id: userId, read: false } as never,
      { read: true }
    );
  }
}

export const NotificationRepository = new NotificationRepositoryClass();
