import { NextRequest } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    let refreshToken: string | undefined;

    // 1. Try to read from cookie
    refreshToken = req.cookies.get('refresh_token')?.value;

    // 2. Try to read from request body if not in cookie
    if (!refreshToken) {
      const body = await req.json().catch(() => ({}));
      refreshToken = body.refreshToken;
    }

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    const response = successResponse({ message: 'Logged out successfully' }, 200);

    // Clear cookies by setting maxAge to 0 (expired)
    response.cookies.set('access_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Logout error', error);
    return internalError('Failed to log out');
  }
}
