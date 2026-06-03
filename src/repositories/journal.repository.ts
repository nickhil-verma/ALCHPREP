import { BaseRepository } from './base.repository';
import { Journal, IJournalDocument } from '@/models/journal.model';

class JournalRepositoryClass extends BaseRepository<IJournalDocument> {
  constructor() {
    super(Journal);
  }

  async findByUser(userId: string, limit: number = 20): Promise<IJournalDocument[]> {
    return this.find(
      { user_id: userId },
      { sort: { created_at: -1 }, limit }
    );
  }

  async findRecent(userId: string, days: number = 7): Promise<IJournalDocument[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.find(
      { user_id: userId, created_at: { $gte: since } },
      { sort: { created_at: -1 } }
    );
  }

  async findByDateRange(
    userId: string,
    start: Date,
    end: Date
  ): Promise<IJournalDocument[]> {
    return this.find(
      { user_id: userId, created_at: { $gte: start, $lte: end } },
      { sort: { created_at: -1 } }
    );
  }
}

export const JournalRepository = new JournalRepositoryClass();
