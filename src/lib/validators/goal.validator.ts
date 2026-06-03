import { z } from 'zod';
import { validateData } from './auth.validator';
import type { GoalPriority, GoalStatus } from '@/types/goal.types';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const);
const statusEnum = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED'] as const);

const skillLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const);

export const createGoalSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long' }).max(150),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid deadline date format',
  }),
  priority: priorityEnum.default('MEDIUM'),
  daily_hours: z.number().min(0.1).max(24).default(1),
  tags: z.array(z.string()).optional(),
  current_skill_level: skillLevelEnum.default('BEGINNER'),
  target_skill_level: skillLevelEnum.default('ADVANCED'),
  goal_dependencies: z.array(z.string()).default([]),
});

export const updateGoalSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().min(10).optional(),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid deadline date format' })
    .optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  daily_hours: z.number().min(0.1).max(24).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  current_skill_level: skillLevelEnum.optional(),
  target_skill_level: skillLevelEnum.optional(),
  goal_dependencies: z.array(z.string()).optional(),
});

export function validateCreateGoal(data: unknown) {
  return validateData(createGoalSchema, data);
}

export function validateUpdateGoal(data: unknown) {
  return validateData(updateGoalSchema, data);
}
