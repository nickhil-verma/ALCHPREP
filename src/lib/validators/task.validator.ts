import { z } from 'zod';
import { validateData } from './auth.validator';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const);
const statusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'OVERDUE'] as const);

export const generateTasksSchema = z.object({
  goal_id: z.string().min(1, { message: 'Goal ID is required' }),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .optional(),
});

export const updateTaskSchema = z.object({
  status: statusEnum.optional(),
  completed_at: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .optional(),
});

export const createTaskSchema = z.object({
  goal_id: z.string().min(1, { message: 'Goal ID is required' }),
  title: z.string().min(3, { message: 'Title must be at least 3 characters long' }).max(150),
  description: z.string().min(5, { message: 'Description must be at least 5 characters long' }),
  estimated_duration: z.number().min(5).max(1440).default(60), // in minutes (5min to 24h)
  priority: priorityEnum.default('MEDIUM'),
  scheduled_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid scheduled time format',
  }),
});

export function validateGenerateTasks(data: unknown) {
  return validateData(generateTasksSchema, data);
}

export function validateUpdateTask(data: unknown) {
  return validateData(updateTaskSchema, data);
}

export function validateCreateTask(data: unknown) {
  return validateData(createTaskSchema, data);
}
