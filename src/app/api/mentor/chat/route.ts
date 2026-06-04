import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { MentorChatService } from '@/services/mentor-chat.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const evaluation = await MentorChatService.getLatestEvaluation(userId);
    return successResponse(evaluation);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error fetching AI Mentor evaluation', error);
    return internalError('Failed to fetch AI Mentor evaluation');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const evaluation = await MentorChatService.generateEvaluation(userId);
    return successResponse(evaluation);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error generating AI Mentor evaluation', error);
    return internalError('Failed to generate AI Mentor evaluation');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    await MentorChatService.clearChatHistory(userId, 'MENTOR');
    return successResponse({ message: 'Evaluation history cleared successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error clearing evaluation history', error);
    return internalError('Failed to clear evaluation history');
  }
}
