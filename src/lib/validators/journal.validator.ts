import { z } from 'zod';
import { validateData } from './auth.validator';

const moodEnum = z.enum(['GREAT', 'GOOD', 'OKAY', 'BAD', 'TERRIBLE'] as const);

export const createJournalSchema = z.object({
  content: z.string().min(10, { message: 'Journal content must be at least 10 characters long' }),
  mood: moodEnum,
  tags: z.array(z.string()).optional(),
});

export function validateCreateJournal(data: unknown) {
  return validateData(createJournalSchema, data);
}
