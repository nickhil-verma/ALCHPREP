import { NextRequest } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { refreshTokenSchema, validateData } from '@/lib/validators/auth.validator';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    let refreshToken: string | undefined;

    // 1. Try to read from cookie first
    refreshToken = req.cookies.get('refresh_token')?.value;

    // 2. If not in cookie, try reading from request body
    if (!refreshToken) {
      const body = await req.json().catch(() => ({}));
      const validatedData = validateData(refreshTokenSchema, body);
      refreshToken = validatedData.refreshToken;
    }

    if (!refreshToken) {
      return errorResponse('Refresh token is required', 'VALIDATION_ERROR', 400);
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = req.headers.get('x-forwarded-for') || undefined;

    const tokens = await AuthService.refresh(refreshToken, userAgent, ipAddress);

    const response = successResponse({ tokens }, 200);

    const isProd = process.env.NODE_ENV === 'production';
    
    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Token refresh error', error);
    return internalError('Failed to refresh token');
  }
}
