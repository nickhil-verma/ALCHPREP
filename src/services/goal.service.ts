import { Types } from 'mongoose';
import { GoalRepository } from '@/repositories/goal.repository';
import { RoadmapRepository } from '@/repositories/roadmap.repository';
import { TaskRepository } from '@/repositories/task.repository';
import { NotFoundError, ForbiddenError } from '@/lib/utils/api-error';
import type { CreateGoalRequest, UpdateGoalRequest } from '@/types/goal.types';
import type { IGoalDocument } from '@/models/goal.model';

class GoalServiceClass {
  /**
   * Create a new goal
   */
  async createGoal(userId: string, data: CreateGoalRequest): Promise<IGoalDocument> {
    return GoalRepository.create({
      user_id: userId,
      title: data.title,
      description: data.description,
      deadline: new Date(data.deadline),
      priority: data.priority,
      daily_hours: data.daily_hours,
      tags: data.tags || [],
      status: 'ACTIVE',
      progress_percentage: 0,
      current_skill_level: data.current_skill_level || 'BEGINNER',
      target_skill_level: data.target_skill_level || 'ADVANCED',
      goal_dependencies: data.goal_dependencies?.map((id) => new Types.ObjectId(id)) || [],
    } as any);
  }

  /**
   * Retrieve goals for a user
   */
  async getGoalsForUser(userId: string, status?: string): Promise<IGoalDocument[]> {
    const filter: any = { user_id: userId };
    if (status) {
      filter.status = status;
    }
    return GoalRepository.find(filter, { sort: { created_at: -1 } });
  }

  /**
   * Retrieve a goal by ID and verify ownership
   */
  async getGoalById(userId: string, goalId: string): Promise<IGoalDocument> {
    const goal = await GoalRepository.findById(goalId);
    if (!goal) {
      throw new NotFoundError('Goal');
    }
    if (goal.user_id.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this goal');
    }
    return goal;
  }

  /**
   * Update goal details
   */
  async updateGoal(
    userId: string,
    goalId: string,
    data: UpdateGoalRequest
  ): Promise<IGoalDocument> {
    const goal = await this.getGoalById(userId, goalId);

    const updateFields: any = {};
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.deadline !== undefined) updateFields.deadline = new Date(data.deadline);
    if (data.priority !== undefined) updateFields.priority = data.priority;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.daily_hours !== undefined) updateFields.daily_hours = data.daily_hours;
    if (data.progress_percentage !== undefined)
      updateFields.progress_percentage = data.progress_percentage;
    if (data.tags !== undefined) updateFields.tags = data.tags;
    if (data.current_skill_level !== undefined) updateFields.current_skill_level = data.current_skill_level;
    if (data.target_skill_level !== undefined) updateFields.target_skill_level = data.target_skill_level;
    if (data.goal_dependencies !== undefined) {
      updateFields.goal_dependencies = data.goal_dependencies.map((id) => new Types.ObjectId(id));
    }

    const updated = await GoalRepository.update(goalId, updateFields);
    if (!updated) {
      throw new NotFoundError('Goal');
    }
    return updated;
  }

  /**
   * Delete a goal and cascade delete associated roadmap, tasks
   */
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    // Verify ownership
    await this.getGoalById(userId, goalId);

    // Cascade delete
    await GoalRepository.delete(goalId);
    await RoadmapRepository.deleteByGoalId(goalId);
    await TaskRepository.deleteMany({ goal_id: goalId });
  }

  /**
   * Recalculate progress_percentage for a goal based on completed tasks
   */
  async updateGoalProgress(goalId: string): Promise<number> {
    const totalTasks = await TaskRepository.count({ goal_id: goalId });
    if (totalTasks === 0) {
      await GoalRepository.update(goalId, { progress_percentage: 0 });
      return 0;
    }

    const completedTasks = await TaskRepository.count({
      goal_id: goalId,
      status: 'COMPLETED',
    });

    const progress = Math.round((completedTasks / totalTasks) * 100);
    await GoalRepository.update(goalId, { progress_percentage: progress });
    return progress;
  }
}

export const GoalService = new GoalServiceClass();
