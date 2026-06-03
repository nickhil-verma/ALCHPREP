import mongoose, { Schema, Document } from 'mongoose';
import type { GoalPriority, GoalStatus } from '@/types/goal.types';

export interface IGoalDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  deadline: Date;
  priority: GoalPriority;
  status: GoalStatus;
  daily_hours: number;
  progress_percentage: number;
  tags: string[];
  goal_start_date?: Date;
  recommended_start_date?: Date;
  preparation_start_date?: Date;
  preparation_end_date?: Date;
  current_skill_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  target_skill_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  skill_gap_score?: number;
  recommended_daily_hours?: number;
  goal_dependencies?: mongoose.Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

const GoalSchema = new Schema<IGoalDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    deadline: { type: Date, required: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED'],
      default: 'ACTIVE',
    },
    daily_hours: { type: Number, required: true, min: 0.5, max: 16 },
    progress_percentage: { type: Number, default: 0, min: 0, max: 100 },
    tags: [{ type: String, trim: true }],
    goal_start_date: { type: Date, default: null },
    recommended_start_date: { type: Date, default: null },
    preparation_start_date: { type: Date, default: null },
    preparation_end_date: { type: Date, default: null },
    current_skill_level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER',
    },
    target_skill_level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'ADVANCED',
    },
    skill_gap_score: { type: Number, default: 0 },
    recommended_daily_hours: { type: Number, default: null },
    goal_dependencies: [{ type: Schema.Types.ObjectId, ref: 'Goal', default: [] }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound index for efficient user+status queries
GoalSchema.index({ user_id: 1, status: 1 });

export const Goal =
  mongoose.models.Goal || mongoose.model<IGoalDocument>('Goal', GoalSchema);
