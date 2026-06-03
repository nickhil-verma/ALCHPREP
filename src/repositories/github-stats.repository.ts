import { BaseRepository } from './base.repository';
import { GithubStats, IGithubStatsDocument } from '@/models/github-stats.model';

class GithubStatsRepositoryClass extends BaseRepository<IGithubStatsDocument> {
  constructor() {
    super(GithubStats);
  }

  async findByUser(userId: string): Promise<IGithubStatsDocument | null> {
    return this.findOne({ user_id: userId });
  }

  async upsertByUser(
    userId: string,
    data: Partial<IGithubStatsDocument>
  ): Promise<IGithubStatsDocument> {
    await this.ensureConnection();
    return this.model.findOneAndUpdate(
      { user_id: userId },
      { $set: { ...data, last_synced: new Date() } },
      { new: true, upsert: true }
    ).lean<IGithubStatsDocument>() as Promise<IGithubStatsDocument>;
  }
}

export const GithubStatsRepository = new GithubStatsRepositoryClass();
