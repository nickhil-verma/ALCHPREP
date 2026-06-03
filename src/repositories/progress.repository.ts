import { BaseRepository } from './base.repository';
import { ProgressSnapshot, IProgressSnapshotDocument } from '@/models/progress-snapshot.model';
import { startOfToday, daysAgo, toDateString } from '@/lib/utils/date';

class ProgressRepositoryClass extends BaseRepository<IProgressSnapshotDocument> {
  constructor() {
    super(ProgressSnapshot);
  }

  async findLatest(userId: string): Promise<IProgressSnapshotDocument | null> {
    return this.findOne({ user_id: userId });
  }

  async findByDate(userId: string, date: Date): Promise<IProgressSnapshotDocument | null> {
    const dateStr = toDateString(date);
    const start = new Date(dateStr);
    const end = new Date(dateStr);
    end.setUTCHours(23, 59, 59, 999);
    return this.findOne({
      user_id: userId,
      date: { $gte: start, $lte: end },
    } as never);
  }

  async findByDateRange(
    userId: string,
    start: Date,
    end: Date
  ): Promise<IProgressSnapshotDocument[]> {
    return this.find(
      { user_id: userId, date: { $gte: start, $lte: end } } as never,
      { sort: { date: -1 } }
    );
  }

  async getStreak(userId: string): Promise<number> {
    const snapshots = await this.find(
      { user_id: userId, daily_completion: { $gt: 0 } } as never,
      { sort: { date: -1 }, limit: 365 }
    );

    let streak = 0;
    const today = startOfToday();

    for (let i = 0; i < snapshots.length; i++) {
      const expected = new Date(today);
      expected.setUTCDate(expected.getUTCDate() - i);
      const snapDate = toDateString(new Date(snapshots[i].date));
      const expectedDate = toDateString(expected);

      if (snapDate === expectedDate) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async upsertToday(
    userId: string,
    data: Partial<IProgressSnapshotDocument>
  ): Promise<IProgressSnapshotDocument> {
    await this.ensureConnection();
    const today = startOfToday();
    return this.model.findOneAndUpdate(
      { user_id: userId, date: today },
      { $set: { ...data, date: today } },
      { new: true, upsert: true, runValidators: true }
    ).lean<IProgressSnapshotDocument>() as Promise<IProgressSnapshotDocument>;
  }

  async getWeeklyAverage(userId: string): Promise<number> {
    const weekAgo = daysAgo(7);
    const snapshots = await this.find(
      { user_id: userId, date: { $gte: weekAgo } } as never,
      { sort: { date: -1 } }
    );
    if (snapshots.length === 0) return 0;
    const total = snapshots.reduce((sum, s) => sum + s.daily_completion, 0);
    return Math.round(total / snapshots.length);
  }
}

export const ProgressRepository = new ProgressRepositoryClass();
