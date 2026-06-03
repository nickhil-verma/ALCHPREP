import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { UserPreferencesRepository } from '@/repositories/user-preferences.repository';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { ai_personality } = body;

    if (!ai_personality || !['STRICT', 'FRIENDLY', 'MOTIVATIONAL', 'ANALYTICAL'].includes(ai_personality)) {
      return errorResponse('ai_personality is invalid or missing', 'VALIDATION_ERROR', 400);
    }

    const preferences = await UserPreferencesRepository.findOrCreate(userId);
    const updated = await UserPreferencesRepository.update(preferences._id.toString(), {
      ai_personality,
    });

    return successResponse(updated);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error saving user preferences', error);
    return internalError('Failed to save preferences');
  }
}
