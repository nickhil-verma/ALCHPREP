import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { JournalRepository } from '@/repositories/journal.repository';
import { JournalAnalyzerService } from '@/services/journal-analyzer.service';
import { validateCreateJournal } from '@/lib/validators/journal.validator';
import { successResponse, errorResponse, internalError } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const journals = await JournalRepository.findByUser(userId, limit);
    return successResponse(journals);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error fetching journal entries', error);
    return internalError('Failed to fetch journal entries');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const validatedData = validateCreateJournal(body);

    const journal = await JournalRepository.create({
      user_id: userId,
      content: validatedData.content,
      mood: validatedData.mood,
      tags: validatedData.tags || [],
    } as any);

    // Run AI analysis immediately so the client receives the analyzed results
    const analyzedJournal = await JournalAnalyzerService.analyzeJournal(userId, journal._id.toString());
    return successResponse(analyzedJournal, 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.code, error.statusCode, error.details);
    }
    logger.error('Error writing journal entry', error);
    return internalError('Failed to save journal entry');
  }
}
