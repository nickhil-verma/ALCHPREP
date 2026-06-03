"use server";

import { getAuthUserFromAction } from '@/lib/auth/middleware';
import { GoalService } from '@/services/goal.service';
import { validateCreateGoal, validateUpdateGoal } from '@/lib/validators/goal.validator';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';
import type { CreateGoalRequest, UpdateGoalRequest } from '@/types/goal.types';

export async function createGoalAction(data: CreateGoalRequest) {
  try {
    const { userId } = await getAuthUserFromAction();
    const validated = validateCreateGoal(data);
    const goal = await GoalService.createGoal(userId, validated);
    // Convert Mongoose doc to plain object for React Server Component serialization
    return { success: true, data: JSON.parse(JSON.stringify(goal)) };
  } catch (error) {
    logger.error('Error in createGoalAction', error);
    if (error instanceof ApiError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    return { success: false, error: { message: 'Failed to create goal', code: 'INTERNAL_ERROR' } };
  }
}

export async function getGoalsAction(status?: string) {
  try {
    const { userId } = await getAuthUserFromAction();
    const goals = await GoalService.getGoalsForUser(userId, status);
    return { success: true, data: JSON.parse(JSON.stringify(goals)) };
  } catch (error) {
    logger.error('Error in getGoalsAction', error);
    if (error instanceof ApiError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    return { success: false, error: { message: 'Failed to fetch goals', code: 'INTERNAL_ERROR' } };
  }
}

export async function updateGoalAction(goalId: string, data: UpdateGoalRequest) {
  try {
    const { userId } = await getAuthUserFromAction();
    const validated = validateUpdateGoal(data);
    const goal = await GoalService.updateGoal(userId, goalId, validated);
    return { success: true, data: JSON.parse(JSON.stringify(goal)) };
  } catch (error) {
    logger.error('Error in updateGoalAction', error);
    if (error instanceof ApiError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    return { success: false, error: { message: 'Failed to update goal', code: 'INTERNAL_ERROR' } };
  }
}

export async function deleteGoalAction(goalId: string) {
  try {
    const { userId } = await getAuthUserFromAction();
    await GoalService.deleteGoal(userId, goalId);
    return { success: true };
  } catch (error) {
    logger.error('Error in deleteGoalAction', error);
    if (error instanceof ApiError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    return { success: false, error: { message: 'Failed to delete goal', code: 'INTERNAL_ERROR' } };
  }
}
