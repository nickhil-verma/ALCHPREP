import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { TaskRepository } from '@/repositories/task.repository';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);

    const tasks = await TaskRepository.findTodayTasks(userId);
    return successResponse(tasks);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error fetching today\'s tasks', error);
    return internalError('Failed to fetch today\'s tasks');
  }
}
