import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { GoalService } from '@/services/goal.service';
import { validateUpdateGoal } from '@/lib/validators/goal.validator';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = getAuthUser(req);
    const { id } = await params;

    const goal = await GoalService.getGoalById(userId, id);
    return successResponse(goal);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error(`Error fetching goal ${req.url}`, error);
    return internalError('Failed to fetch goal');
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = getAuthUser(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validatedData = validateUpdateGoal(body);

    const goal = await GoalService.updateGoal(userId, id, validatedData);
    return successResponse(goal);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error(`Error updating goal ${req.url}`, error);
    return internalError('Failed to update goal');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = getAuthUser(req);
    const { id } = await params;

    await GoalService.deleteGoal(userId, id);
    return successResponse({ message: 'Goal and associated data deleted successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error(`Error deleting goal ${req.url}`, error);
    return internalError('Failed to delete goal');
  }
}
