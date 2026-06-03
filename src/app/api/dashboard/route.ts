import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { DashboardService } from '@/services/dashboard.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const data = await DashboardService.getDashboardData(userId);
    return successResponse(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error fetching dashboard aggregation', error);
    return internalError('Failed to fetch dashboard aggregation');
  }
}
