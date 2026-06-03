import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import { UnauthorizedError } from '@/lib/utils/api-error';
import type { JwtPayload } from '@/types/auth.types';

/**
 * Extracts and verifies the JWT token from the Request.
 * Checks both the Authorization header and the access_token cookie.
 * Throws UnauthorizedError if verification fails or token is missing.
 */
export function getAuthUser(req: Request | NextRequest): JwtPayload {
  let token: string | null = null;

  // 1. Check Authorization Header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check cookies if req is NextRequest or has a headers cookie reader
  if (!token) {
    // Standard request cookies header parsing
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    token = cookies['access_token'] || null;
  }

  if (!token) {
    throw new UnauthorizedError('Authentication token is missing');
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new UnauthorizedError('Authentication token is invalid or expired');
  }

  return payload;
}

/**
 * Extracts and verifies the JWT token from cookies inside Next.js Server Actions.
 * Throws UnauthorizedError if verification fails or token is missing.
 */
export async function getAuthUserFromAction(): Promise<JwtPayload> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    throw new UnauthorizedError('Authentication token is missing');
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new UnauthorizedError('Authentication token is invalid or expired');
  }

  return payload;
}
