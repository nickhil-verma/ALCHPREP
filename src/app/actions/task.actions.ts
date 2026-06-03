"use server";

import { getAuthUserFromAction } from '@/lib/auth/middleware';
import { TaskGeneratorService } from '@/services/task-generator.service';
import { TaskRepository } from '@/repositories/task.repository';
import { GoalService } from '@/services/goal.service';
import { ProgressRepository } from '@/repositories/progress.repository';
import { validateUpdateTask } from '@/lib/validators/task.validator';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function generateDailyTasksAction(goalId: string, date?: string) {
  try {
    const { userId } = await getAuthUserFromAction();
    const tasks = await TaskGeneratorService.generateDailyTasks(userId, goalId, date);
    return { success: true, data: JSON.parse(JSON.stringify(tasks)) };
  } catch (error) {
    logger.error('Error in generateDailyTasksAction', error);
    if (error instanceof ApiError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    return { success: false, error: { message: 'Failed to generate tasks', code: 'INTERNAL_ERROR' } };
  }
}

export async function updateTaskStatusAction(taskId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'OVERDUE') {
  try {
    const { userId } = await getAuthUserFromAction();
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      return { success: false, error: { message: 'Task not found', code: 'NOT_FOUND' } };
    }
    if (task.user_id.toString() !== userId) {
      return { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } };
    }

    const validated = validateUpdateTask({ status });

    let updatedTask;
    if (validated.status === 'COMPLETED') {
      updatedTask = await TaskRepository.markComplete(taskId);
    } else {
      updatedTask = await TaskRepository.update(taskId, validated);
    }

    if (!updatedTask) {
      return { success: false, error: { message: 'Failed to update task', code: 'NOT_FOUND' } };
    }

    // Cascade updates
    await GoalService.updateGoalProgress(task.goal_id.toString());

    // Update today's progress snapshot
    const todayTasks = await TaskRepository.findTodayTasks(userId);
    const totalToday = todayTasks.length;
    const completedToday = todayTasks.filter((t) => t.status === 'COMPLETED').length;
    const dailyCompletionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    await ProgressRepository.upsertToday(userId, {
      daily_completion: dailyCompletionPercentage,
      tasks_completed: completedToday,
      tasks_total: totalToday,
    });

    return { success: true, data: JSON.parse(JSON.stringify(updatedTask)) };
  } catch (error) {
    logger.error('Error in updateTaskStatusAction', error);
    if (error instanceof ApiError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    return { success: false, error: { message: 'Failed to update task', code: 'INTERNAL_ERROR' } };
  }
}

export async function deleteTaskAction(taskId: string) {
  try {
    const { userId } = await getAuthUserFromAction();
    const task = await TaskRepository.findById(taskId);
    if (!task) {
      return { success: false, error: { message: 'Task not found', code: 'NOT_FOUND' } };
    }
    if (task.user_id.toString() !== userId) {
      return { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } };
    }

    await TaskRepository.delete(taskId);

    // Recalculate goal progress
    await GoalService.updateGoalProgress(task.goal_id.toString());

    // Recalculate progress snapshot
    const todayTasks = await TaskRepository.findTodayTasks(userId);
    const totalToday = todayTasks.length;
    const completedToday = todayTasks.filter((t) => t.status === 'COMPLETED').length;
    const dailyCompletionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    await ProgressRepository.upsertToday(userId, {
      daily_completion: dailyCompletionPercentage,
      tasks_completed: completedToday,
      tasks_total: totalToday,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error in deleteTaskAction', error);
    if (error instanceof ApiError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    return { success: false, error: { message: 'Failed to delete task', code: 'INTERNAL_ERROR' } };
  }
}
