import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { TaskRepository } from '@/repositories/task.repository';
import { GoalService } from '@/services/goal.service';
import { ProgressRepository } from '@/repositories/progress.repository';
import { validateUpdateTask } from '@/lib/validators/task.validator';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError, NotFoundError, ForbiddenError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = getAuthUser(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validatedData = validateUpdateTask(body);

    const task = await TaskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task');
    }
    if (task.user_id.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this task');
    }

    // Apply the updates
    let updatedTask;
    if (validatedData.status === 'COMPLETED') {
      updatedTask = await TaskRepository.markComplete(id);
    } else {
      updatedTask = await TaskRepository.update(id, validatedData);
    }

    if (!updatedTask) {
      throw new NotFoundError('Task');
    }

    // Trigger cascading updates
    // 1. Recalculate goal progress percentage
    await GoalService.updateGoalProgress(task.goal_id.toString());

    // 2. Recalculate today's progress snapshot completion metrics
    const todayTasks = await TaskRepository.findTodayTasks(userId);
    const totalToday = todayTasks.length;
    const completedToday = todayTasks.filter((t) => t.status === 'COMPLETED').length;
    const dailyCompletionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    await ProgressRepository.upsertToday(userId, {
      daily_completion: dailyCompletionPercentage,
      tasks_completed: completedToday,
      tasks_total: totalToday,
    });

    return successResponse(updatedTask);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error(`Error updating task ${req.url}`, error);
    return internalError('Failed to update task');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = getAuthUser(req);
    const { id } = await params;

    const task = await TaskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task');
    }
    if (task.user_id.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this task');
    }

    await TaskRepository.delete(id);

    // Recalculate goal progress
    await GoalService.updateGoalProgress(task.goal_id.toString());

    // Recalculate today's progress snapshot
    const todayTasks = await TaskRepository.findTodayTasks(userId);
    const totalToday = todayTasks.length;
    const completedToday = todayTasks.filter((t) => t.status === 'COMPLETED').length;
    const dailyCompletionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    await ProgressRepository.upsertToday(userId, {
      daily_completion: dailyCompletionPercentage,
      tasks_completed: completedToday,
      tasks_total: totalToday,
    });

    return successResponse({ message: 'Task deleted and progress recalculated successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error(`Error deleting task ${req.url}`, error);
    return internalError('Failed to delete task');
  }
}
