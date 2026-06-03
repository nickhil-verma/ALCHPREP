import { BaseRepository } from './base.repository';
import { DeviceToken, IDeviceTokenDocument } from '@/models/device-token.model';

class DeviceTokenRepositoryClass extends BaseRepository<IDeviceTokenDocument> {
  constructor() {
    super(DeviceToken);
  }

  async findByToken(token: string): Promise<IDeviceTokenDocument | null> {
    await this.ensureConnection();
    return this.model.findOne({ token });
  }

  async findActiveTokensForUser(userId: string): Promise<IDeviceTokenDocument[]> {
    await this.ensureConnection();
    return this.model.find({ user_id: userId, active: true });
  }

  async registerToken(
    userId: string,
    token: string,
    platform: 'WEB' | 'ANDROID' | 'IOS'
  ): Promise<IDeviceTokenDocument> {
    await this.ensureConnection();
    // Upsert the token to ensure it belongs to the current user and is active
    return this.model.findOneAndUpdate(
      { token },
      {
        user_id: userId,
        platform,
        active: true,
      },
      { upsert: true, new: true }
    ) as Promise<IDeviceTokenDocument>;
  }

  async deactivateToken(token: string): Promise<IDeviceTokenDocument | null> {
    await this.ensureConnection();
    return this.model.findOneAndUpdate({ token }, { active: false }, { new: true });
  }

  async deactivateAllForUser(userId: string): Promise<void> {
    await this.ensureConnection();
    await this.model.updateMany({ user_id: userId }, { active: false });
  }
}

export const DeviceTokenRepository = new DeviceTokenRepositoryClass();
