import { BaseRepository } from './base.repository';
import { User, IUserDocument } from '@/models/user.model';

class UserRepositoryClass extends BaseRepository<IUserDocument> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    await this.ensureConnection();
    // Need password_hash for auth — use select('+password_hash') bypass
    return this.model.findOne({ email: email.toLowerCase() });
  }

  async findByIdWithPassword(id: string): Promise<IUserDocument | null> {
    await this.ensureConnection();
    return this.model.findById(id);
  }

  async updateTimezone(userId: string, timezone: string): Promise<IUserDocument | null> {
    return this.update(userId, { timezone });
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<IUserDocument['notification_preferences']>
  ): Promise<IUserDocument | null> {
    return this.update(userId, {
      $set: Object.fromEntries(
        Object.entries(preferences).map(([k, v]) => [`notification_preferences.${k}`, v])
      ),
    });
  }
}

export const UserRepository = new UserRepositoryClass();
