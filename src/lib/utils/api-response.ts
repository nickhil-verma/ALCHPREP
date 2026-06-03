// ============================================
// Standardized API Response Helpers
// ============================================

import { NextResponse } from 'next/server';
import type { ApiResponse, PaginationMeta } from '@/types/api.types';

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  status = 200
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    { success: true, data, meta },
    { status }
  );
}

export function errorResponse(
  message: string,
  code: string,
  status: number,
  details?: Record<string, string[]>
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details && { details }) },
    },
    { status }
  );
}

export function validationError(
  details: Record<string, string[]>
): NextResponse<ApiResponse<never>> {
  return errorResponse(
    'Validation failed',
    'VALIDATION_ERROR',
    400,
    details
  );
}

export function unauthorizedError(
  message = 'Authentication required'
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, 'UNAUTHORIZED', 401);
}

export function forbiddenError(
  message = 'Insufficient permissions'
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, 'FORBIDDEN', 403);
}

export function notFoundError(
  resource = 'Resource'
): NextResponse<ApiResponse<never>> {
  return errorResponse(`${resource} not found`, 'NOT_FOUND', 404);
}

export function internalError(
  message = 'Internal server error'
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, 'INTERNAL_ERROR', 500);
}
