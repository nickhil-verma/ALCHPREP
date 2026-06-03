import { UserRepository } from '@/repositories/user.repository';
import { SessionRepository } from '@/repositories/session.repository';
import { hashPassword, comparePassword } from '@/lib/auth/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { ConflictError, UnauthorizedError } from '@/lib/utils/api-error';
import type {
  SignupRequest,
  LoginRequest,
  AuthTokens,
  AuthUser,
  JwtPayload,
} from '@/types/auth.types';
import type { IUserDocument } from '@/models/user.model';

class AuthServiceClass {
  /**
   * Helper to map Mongoose user document to clean AuthUser type
   */
  private mapUser(user: IUserDocument): AuthUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      timezone: user.timezone,
      created_at: user.created_at,
    };
  }

  /**
   * Register a new user
   */
  async signup(
    data: SignupRequest,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existingUser = await UserRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    const newUser = await UserRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password_hash: hashedPassword,
      timezone: data.timezone || 'UTC',
    });

    const jwtPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: newUser._id.toString(),
      email: newUser.email,
    };

    const accessToken = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    // Refresh token expiry is 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await SessionRepository.createSession(
      newUser._id.toString(),
      refreshToken,
      expiresAt,
      deviceInfo,
      ipAddress
    );

    return {
      user: this.mapUser(newUser),
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Authenticate a user with email and password
   */
  async login(
    data: LoginRequest,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const jwtPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user._id.toString(),
      email: user.email,
    };

    const accessToken = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await SessionRepository.createSession(
      user._id.toString(),
      refreshToken,
      expiresAt,
      deviceInfo,
      ipAddress
    );

    return {
      user: this.mapUser(user),
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Refresh access and refresh tokens (Token Rotation)
   */
  async refresh(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const session = await SessionRepository.findByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedError('Session not found or already invalidated');
    }

    if (session.expires_at < new Date()) {
      await SessionRepository.deleteSession(refreshToken);
      throw new UnauthorizedError('Session has expired');
    }

    // Token Rotation
    const jwtPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: payload.userId,
      email: payload.email,
    };

    const newAccessToken = signAccessToken(jwtPayload);
    const newRefreshToken = signRefreshToken(jwtPayload);

    // Delete old session and create a new one
    await SessionRepository.deleteSession(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await SessionRepository.createSession(
      payload.userId,
      newRefreshToken,
      expiresAt,
      deviceInfo,
      ipAddress
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Invalidate a session (Logout)
   */
  async logout(refreshToken: string): Promise<void> {
    await SessionRepository.deleteSession(refreshToken);
  }
}

export const AuthService = new AuthServiceClass();
