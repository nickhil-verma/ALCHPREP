import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { DeviceTokenRepository } from '@/repositories/device-token.repository';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { token, platform = 'WEB' } = body;

    if (!token || typeof token !== 'string') {
      return errorResponse('token is required and must be a string', 'VALIDATION_ERROR', 400);
    }
    if (!['WEB', 'ANDROID', 'IOS'].includes(platform)) {
      return errorResponse('platform must be WEB, ANDROID, or IOS', 'VALIDATION_ERROR', 400);
    }

    const deviceToken = await DeviceTokenRepository.registerToken(userId, token, platform);
    return successResponse(deviceToken);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error registering device token', error);
    return internalError('Failed to register device token');
  }
}
