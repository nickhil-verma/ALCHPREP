import { BaseRepository } from './base.repository';
import { Task, ITaskDocument } from '@/models/task.model';
import { startOfToday, endOfToday } from '@/lib/utils/date';

class TaskRepositoryClass extends BaseRepository<ITaskDocument> {
  constructor() {
    super(Task);
  }

  async findTodayTasks(userId: string): Promise<ITaskDocument[]> {
    return this.find(
      {
        user_id: userId,
        scheduled_time: { $gte: startOfToday(), $lte: endOfToday() },
      },
      { sort: { priority: -1, scheduled_time: 1 } }
    );
  }

  async findByGoal(goalId: string): Promise<ITaskDocument[]> {
    return this.find({ goal_id: goalId }, { sort: { scheduled_time: 1 } });
  }

  async findRecentCompleted(userId: string, days: number = 7): Promise<ITaskDocument[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.find(
      {
        user_id: userId,
        status: 'COMPLETED',
        completed_at: { $gte: since },
      },
      { sort: { completed_at: -1 } }
    );
  }

  async markComplete(taskId: string): Promise<ITaskDocument | null> {
    return this.update(taskId, {
      status: 'COMPLETED',
      completed_at: new Date(),
    });
  }

  async markOverdue(userId: string): Promise<number> {
    const now = new Date();
    return this.updateMany(
      {
        user_id: userId,
        status: { $in: ['PENDING', 'IN_PROGRESS'] },
        scheduled_time: { $lt: now },
      },
      { status: 'OVERDUE' }
    );
  }

  async countByDateRange(
    userId: string,
    start: Date,
    end: Date,
    status?: string
  ): Promise<number> {
    const filter: Record<string, unknown> = {
      user_id: userId,
      scheduled_time: { $gte: start, $lte: end },
    };
    if (status) filter.status = status;
    return this.count(filter as never);
  }
}

export const TaskRepository = new TaskRepositoryClass();
