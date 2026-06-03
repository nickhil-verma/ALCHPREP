import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { RoadmapGeneratorService } from '@/services/roadmap-generator.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { goalId } = body;

    if (!goalId) {
      return errorResponse('goalId is required', 'VALIDATION_ERROR', 400);
    }

    const roadmap = await RoadmapGeneratorService.generateRoadmap(userId, goalId);
    return successResponse(roadmap, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error in roadmap generation API', error);
    return internalError('Failed to generate roadmap');
  }
}
