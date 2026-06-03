import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { TaskGeneratorService } from '@/services/task-generator.service';
import { validateGenerateTasks } from '@/lib/validators/task.validator';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const validatedData = validateGenerateTasks(body);

    const tasks = await TaskGeneratorService.generateDailyTasks(
      userId,
      validatedData.goal_id,
      validatedData.date
    );

    return successResponse(tasks, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error in daily tasks generation API', error);
    return internalError('Failed to generate daily tasks');
  }
}
