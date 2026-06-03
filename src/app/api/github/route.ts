import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { GithubStatsRepository } from '@/repositories/github-stats.repository';
import { GithubAnalyzerService } from '@/services/github-analyzer.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const stats = await GithubStatsRepository.findByUser(userId);
    return successResponse(stats);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error fetching github stats', error);
    return internalError('Failed to fetch github stats');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return errorResponse('username is required and must be a string', 'VALIDATION_ERROR', 400);
    }

    const stats = await GithubAnalyzerService.syncGithubStats(userId, username);
    return successResponse(stats);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error syncing github stats', error);
    return internalError('Failed to sync github stats');
  }
}
