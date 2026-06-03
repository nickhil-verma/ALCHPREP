// ============================================
// Authentication Types
// ============================================

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  timezone: string;
  created_at: Date;
}

export interface SessionDocument {
  user_id: string;
  refresh_token: string;
  expires_at: Date;
  device_info?: string;
  ip_address?: string;
  created_at: Date;
}
