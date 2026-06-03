import { BaseRepository } from './base.repository';
import { Goal, IGoalDocument } from '@/models/goal.model';
import type { GoalStatus } from '@/types/goal.types';

class GoalRepositoryClass extends BaseRepository<IGoalDocument> {
  constructor() {
    super(Goal);
  }

  async findByUser(userId: string): Promise<IGoalDocument[]> {
    return this.find({ user_id: userId }, { sort: { created_at: -1 } });
  }

  async findActive(userId: string): Promise<IGoalDocument[]> {
    return this.find(
      { user_id: userId, status: 'ACTIVE' },
      { sort: { priority: -1, deadline: 1 } }
    );
  }

  async findByStatus(userId: string, status: GoalStatus): Promise<IGoalDocument[]> {
    return this.find({ user_id: userId, status });
  }

  async updateProgress(goalId: string, percentage: number): Promise<IGoalDocument | null> {
    const status = percentage >= 100 ? 'COMPLETED' : undefined;
    return this.update(goalId, {
      progress_percentage: Math.min(100, percentage),
      ...(status && { status }),
    });
  }

  async belongsToUser(goalId: string, userId: string): Promise<boolean> {
    const count = await this.count({ _id: goalId, user_id: userId });
    return count > 0;
  }
}

export const GoalRepository = new GoalRepositoryClass();
