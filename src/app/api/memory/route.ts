import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { MemoryService } from '@/services/memory.service';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError, ValidationError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || undefined) as any;

    const memories = await MemoryService.getMemories(userId, type);
    return successResponse(memories);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error fetching memories', error);
    return internalError('Failed to fetch memories');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { content, type, importanceScore, category } = body;

    if (!content || typeof content !== 'string') {
      throw new ValidationError({ content: ['content is required and must be a string'] });
    }
    if (!type || !['SHORT', 'MEDIUM', 'LONG'].includes(type)) {
      throw new ValidationError({ type: ['type is required and must be SHORT, MEDIUM, or LONG'] });
    }
    if (importanceScore === undefined || typeof importanceScore !== 'number' || importanceScore < 0 || importanceScore > 10) {
      throw new ValidationError({ importanceScore: ['importanceScore is required and must be a number between 0 and 10'] });
    }

    const memory = await MemoryService.addMemory(
      userId,
      content,
      type,
      importanceScore,
      category
    );

    return successResponse(memory, 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error adding memory', error);
    return internalError('Failed to save memory');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Memory id is required', 'VALIDATION_ERROR', 400);
    }

    await MemoryService.deleteMemory(userId, id);
    return successResponse({ message: 'Memory item deleted successfully' });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error deleting memory', error);
    return internalError('Failed to delete memory');
  }
}
