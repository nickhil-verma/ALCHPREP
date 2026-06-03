import { logger } from '@/lib/utils/logger';

/**
 * Safely parse JSON strings, stripping potential markdown blocks from AI responses
 */
export function safeParseJSON<T>(text: string): T {
  let cleaned = text.trim();

  // Strip markdown formatting if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/, '');
    cleaned = cleaned.replace(/```\s*$/, '');
    cleaned = cleaned.trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    logger.error('JSON parsing failed. Raw response was:', text);
    throw new Error(`Failed to parse AI JSON response: ${(error as Error).message}`);
  }
}
