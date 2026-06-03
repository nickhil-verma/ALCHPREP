import { BaseRepository } from './base.repository';
import { Session, ISessionDocument } from '@/models/session.model';

class SessionRepositoryClass extends BaseRepository<ISessionDocument> {
  constructor() {
    super(Session);
  }

  async findByRefreshToken(token: string): Promise<ISessionDocument | null> {
    await this.ensureConnection();
    return this.model.findOne({ refresh_token: token });
  }

  async createSession(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<ISessionDocument> {
    await this.ensureConnection();
    return this.model.create({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      device_info: deviceInfo || undefined,
      ip_address: ipAddress || undefined,
    });
  }

  async deleteSession(token: string): Promise<ISessionDocument | null> {
    await this.ensureConnection();
    return this.model.findOneAndDelete({ refresh_token: token });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.ensureConnection();
    await this.model.deleteMany({ user_id: userId });
  }
}

export const SessionRepository = new SessionRepositoryClass();
