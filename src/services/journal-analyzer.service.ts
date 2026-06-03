import { JournalRepository } from '@/repositories/journal.repository';
import { MemoryRepository } from '@/repositories/memory.repository';
import { openai, AI_MODEL } from '@/lib/ai/client';
import { JOURNAL_ANALYSIS_PROMPT } from '@/lib/ai/prompts';
import { safeParseJSON } from '@/lib/ai/parser';
import { logger } from '@/lib/utils/logger';
import { ApiError, NotFoundError, ForbiddenError } from '@/lib/utils/api-error';
import type { IJournalDocument } from '@/models/journal.model';
import type { MemoryType } from '@/types/memory.types';

interface SuggestedMemory {
  content: string;
  importance: number;
  type: MemoryType;
}

interface JournalAnalysisResponse {
  analysis: string;
  lessons_learned: string[];
  suggested_memories: SuggestedMemory[];
}

class JournalAnalyzerServiceClass {
  /**
   * Analyzes a journal entry, updates it with AI analysis and insights, and populates the memory repository.
   */
  async analyzeJournal(userId: string, journalId: string): Promise<IJournalDocument> {
    const journal = await JournalRepository.findById(journalId);
    if (!journal) {
      throw new NotFoundError('Journal entry');
    }
    if (journal.user_id.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this journal entry');
    }

    logger.info(`Analyzing journal entry ${journalId} for user ${userId}`);

    const prompt = JOURNAL_ANALYSIS_PROMPT
      .replace('{content}', journal.content)
      .replace('{mood}', journal.mood);

    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const rawResponse = completion.choices[0]?.message?.content;
      if (!rawResponse) {
        throw new Error('AI returned an empty response');
      }

      const parsed = safeParseJSON<JournalAnalysisResponse>(rawResponse);

      // Save suggested memories into the memory repository
      if (parsed.suggested_memories && Array.isArray(parsed.suggested_memories)) {
        for (const memory of parsed.suggested_memories) {
          await MemoryRepository.create({
            user_id: journal.user_id,
            type: memory.type || 'SHORT',
            content: memory.content,
            importance_score: memory.importance || 5,
            source: `journal-${journalId}`,
            category: 'JOURNAL_INSIGHT',
          });
        }
        logger.info(`Saved ${parsed.suggested_memories.length} suggested memories from journal analysis`);
      }

      // Format analysis with lessons learned if any were extracted
      let combinedAnalysis = parsed.analysis;
      if (parsed.lessons_learned && parsed.lessons_learned.length > 0) {
        combinedAnalysis += '\n\n**Lessons Learned:**\n' + parsed.lessons_learned.map((l) => `- ${l}`).join('\n');
      }

      // Update journal with the analysis results
      const updatedJournal = await JournalRepository.update(journalId, {
        ai_analysis: combinedAnalysis,
      });

      if (!updatedJournal) {
        throw new NotFoundError('Journal entry');
      }

      logger.info(`Journal analysis successfully completed for entry ${journalId}`);
      return updatedJournal;
    } catch (error) {
      logger.error('Error analyzing journal entry', error);
      throw new ApiError(
        `Failed to analyze journal entry: ${(error as Error).message}`,
        500,
        'AI_GENERATION_FAILED'
      );
    }
  }
}

export const JournalAnalyzerService = new JournalAnalyzerServiceClass();
