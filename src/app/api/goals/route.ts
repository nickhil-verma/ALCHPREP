import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { GoalService } from '@/services/goal.service';
import { validateCreateGoal } from '@/lib/validators/goal.validator';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const goals = await GoalService.getGoalsForUser(userId, status);
    return successResponse(goals);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error fetching goals', error);
    return internalError('Failed to fetch goals');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const validatedData = validateCreateGoal(body);

    const goal = await GoalService.createGoal(userId, validatedData);
    return successResponse(goal, 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error creating goal', error);
    return internalError('Failed to create goal');
  }
}
