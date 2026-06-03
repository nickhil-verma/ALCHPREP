import { z } from 'zod';
import { ValidationError } from '@/lib/utils/api-error';

export const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  timezone: z.string().optional().default('UTC'),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

/**
 * Validates request data against a zod schema and throws ValidationError on failure.
 */
export function validateData<T>(schema: z.Schema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || 'body';
      if (!details[field]) {
        details[field] = [];
      }
      details[field].push(issue.message);
    }
    throw new ValidationError(details);
  }
  return result.data;
}
