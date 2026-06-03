import { NextRequest } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { loginSchema, validateData } from '@/lib/validators/auth.validator';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const validatedData = validateData(loginSchema, body);

    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = req.headers.get('x-forwarded-for') || undefined;

    const { user, tokens } = await AuthService.login(validatedData, userAgent, ipAddress);

    const response = successResponse({ user, tokens }, 200);

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
    logger.error('Login error', error);
    return internalError('Failed to log in');
  }
}
