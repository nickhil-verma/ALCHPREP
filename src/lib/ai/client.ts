import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';

const geminiApiKey = process.env.GEMINI_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Use Gemini if its key is defined, otherwise fall back to OpenAI
export const isGemini = !!geminiApiKey;
const apiKey = geminiApiKey || openaiApiKey;

if (!apiKey) {
  logger.warn('Neither GEMINI_API_KEY nor OPENAI_API_KEY is defined in environment variables. AI operations will fail.');
} else {
  logger.info(`AI Client initialized using ${isGemini ? 'Gemini API' : 'OpenAI API'}`);
}

export const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key',
  baseURL: isGemini ? 'https://generativelanguage.googleapis.com/v1beta/openai/' : undefined,
});

export const AI_MODEL = isGemini ? 'gemini-2.5-flash' : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

/**
 * Checks if the AI client is configured correctly
 */
export function isAIConfigured(): boolean {
  return !!apiKey;
}
