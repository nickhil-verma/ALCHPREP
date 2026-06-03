import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { GoalService } from '@/services/goal.service';
import { RoadmapRepository } from '@/repositories/roadmap.repository';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError, NotFoundError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

interface RouteParams {
  params: Promise<{
    goalId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = getAuthUser(req);
    const { goalId } = await params;

    // Verify ownership of the goal
    await GoalService.getGoalById(userId, goalId);

    const roadmap = await RoadmapRepository.findByGoal(goalId);
    if (!roadmap) {
      throw new NotFoundError('Roadmap');
    }

    return successResponse(roadmap);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error(`Error fetching roadmap for goal ${req.url}`, error);
    return internalError('Failed to fetch roadmap');
  }
}
