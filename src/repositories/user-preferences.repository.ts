import { BaseRepository } from './base.repository';
import { UserPreferences, IUserPreferencesDocument } from '@/models/user-preferences.model';

class UserPreferencesRepositoryClass extends BaseRepository<IUserPreferencesDocument> {
  constructor() {
    super(UserPreferences);
  }

  async findByUserId(userId: string): Promise<IUserPreferencesDocument | null> {
    await this.ensureConnection();
    return this.model.findOne({ user_id: userId });
  }

  async findOrCreate(userId: string): Promise<IUserPreferencesDocument> {
    await this.ensureConnection();
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    return this.model.create({
      user_id: userId,
      theme: 'system',
      language: 'en',
      ai_personality: 'MOTIVATIONAL',
      daily_goal_hours: 4,
      preferred_study_time: 'MORNING',
      weekly_report_enabled: true,
    });
  }
}

export const UserPreferencesRepository = new UserPreferencesRepositoryClass();
