import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { JournalRepository } from '@/repositories/journal.repository';
import { JournalAnalyzerService } from '@/services/journal-analyzer.service';
import { validateCreateJournal } from '@/lib/validators/journal.validator';
import { successResponse, errorResponse, internalError, notFoundError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = getAuthUser(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    
    // Validate request body
    const validatedData = validateCreateJournal(body);

    const journal = await JournalRepository.findById(id);
    if (!journal) {
      return notFoundError('Journal entry');
    }

    if (journal.user_id.toString() !== userId) {
      return errorResponse('You do not have access to this journal entry', 'FORBIDDEN', 403);
    }

    // Update journal entry
    const updated = await JournalRepository.update(id, {
      content: validatedData.content,
      mood: validatedData.mood,
      tags: validatedData.tags || [],
    });

    if (!updated) {
      return notFoundError('Journal entry');
    }

    // Run AI analysis immediately so the client gets updated insights
    const analyzed = await JournalAnalyzerService.analyzeJournal(userId, id);
    return successResponse(analyzed, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error updating journal entry', error);
    return internalError('Failed to update journal entry');
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = getAuthUser(req);
    const { id } = await params;

    const journal = await JournalRepository.findById(id);
    if (!journal) {
      return notFoundError('Journal entry');
    }

    if (journal.user_id.toString() !== userId) {
      return errorResponse('You do not have access to this journal entry', 'FORBIDDEN', 403);
    }

    const deleted = await JournalRepository.delete(id);
    return successResponse({ deleted }, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error deleting journal entry', error);
    return internalError('Failed to delete journal entry');
  }
}
