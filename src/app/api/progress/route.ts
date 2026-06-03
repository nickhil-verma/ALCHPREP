import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { ProgressRepository } from '@/repositories/progress.repository';
import { ProgressAnalyzerService } from '@/services/progress-analyzer.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';
import { daysAgo } from '@/lib/utils/date';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const start = daysAgo(days);
    const end = new Date();

    const snapshots = await ProgressRepository.findByDateRange(userId, start, end);
    return successResponse(snapshots);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error fetching progress snapshots', error);
    return internalError('Failed to fetch progress snapshots');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const report = await ProgressAnalyzerService.generateWeeklyReport(userId);
    return successResponse(report);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error compiling weekly progress report', error);
    return internalError('Failed to compile weekly progress report');
  }
}
