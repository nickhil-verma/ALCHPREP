import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/types/auth.types';
import { logger } from '@/lib/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me_in_prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_change_me_in_prod';

// Access token expires in 15 minutes, refresh token in 7 days
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

if (JWT_SECRET === 'dev_secret_key_change_me_in_prod') {
  logger.warn('Using default JWT_SECRET. Set JWT_SECRET environment variable in production!');
}

/**
 * Sign a new Access Token
 */
export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Sign a new Refresh Token
 */
export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verify Access Token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    logger.debug('Access Token verification failed', error);
    return null;
  }
}

/**
 * Verify Refresh Token
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    logger.debug('Refresh Token verification failed', error);
    return null;
  }
}
