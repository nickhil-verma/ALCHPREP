import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { MentorChatService } from '@/services/mentor-chat.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const contextType = (searchParams.get('contextType') || 'MENTOR') as any;
    const goalId = searchParams.get('goalId') || undefined;

    const messages = await MentorChatService.getChatHistory(userId, contextType, goalId);
    return successResponse(messages);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error fetching chat history', error);
    return internalError('Failed to fetch chat history');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { message, contextType = 'MENTOR', goalId } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return errorResponse('message is required', 'VALIDATION_ERROR', 400);
    }

    const aiMessage = await MentorChatService.sendMessage(
      userId,
      message,
      contextType,
      goalId
    );

    return successResponse({ response: aiMessage });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error sending chat message', error);
    return internalError('Failed to process message');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const contextType = (searchParams.get('contextType') || 'MENTOR') as any;
    const goalId = searchParams.get('goalId') || undefined;

    await MentorChatService.clearChatHistory(userId, contextType, goalId);
    return successResponse({ message: 'Conversation history cleared successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error clearing chat history', error);
    return internalError('Failed to clear chat history');
  }
}
