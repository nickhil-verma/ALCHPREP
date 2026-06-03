"use server";

import { getAuthUserFromAction } from '@/lib/auth/middleware';
import { JournalRepository } from '@/repositories/journal.repository';
import { JournalAnalyzerService } from '@/services/journal-analyzer.service';
import { validateCreateJournal } from '@/lib/validators/journal.validator';
import { ApiError } from '@/lib/utils/api-error';
import { logger } from '@/lib/utils/logger';
import type { CreateJournalRequest } from '@/types/journal.types';

export async function createJournalAction(data: CreateJournalRequest) {
  try {
    const { userId } = await getAuthUserFromAction();
    const validated = validateCreateJournal(data);

    const journal = await JournalRepository.create({
      user_id: userId,
      content: validated.content,
      mood: validated.mood,
      tags: validated.tags || [],
    } as any);

    // Run analyzer synchronously for a better user experience in server action
    const analyzed = await JournalAnalyzerService.analyzeJournal(userId, journal._id.toString());
    
    return { success: true, data: JSON.parse(JSON.stringify(analyzed)) };
  } catch (error) {
    logger.error('Error in createJournalAction', error);
    if (error instanceof ApiError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    return { success: false, error: { message: 'Failed to create journal entry', code: 'INTERNAL_ERROR' } };
  }
}

export async function getJournalsAction(limit = 20) {
  try {
    const { userId } = await getAuthUserFromAction();
    const journals = await JournalRepository.findByUser(userId, limit);
    return { success: true, data: JSON.parse(JSON.stringify(journals)) };
  } catch (error) {
    logger.error('Error in getJournalsAction', error);
    if (error instanceof ApiError) {
      return { success: false, error: { message: error.message, code: error.code } };
    }
    return { success: false, error: { message: 'Failed to fetch journal entries', code: 'INTERNAL_ERROR' } };
  }
}
