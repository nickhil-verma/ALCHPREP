import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { NotificationService } from '@/services/notification.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { title, body: contentBody, type = 'TASK_REMINDER', data } = body;

    if (!title || typeof title !== 'string') {
      return errorResponse('title is required and must be a string', 'VALIDATION_ERROR', 400);
    }
    if (!contentBody || typeof contentBody !== 'string') {
      return errorResponse('body is required and must be a string', 'VALIDATION_ERROR', 400);
    }

    const notification = await NotificationService.sendNotification(
      userId,
      type,
      title,
      contentBody,
      data
    );

    return successResponse(notification);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error sending test notification', error);
    return internalError('Failed to send notification');
  }
}
