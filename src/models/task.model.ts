import mongoose, { Schema, Document } from 'mongoose';
import type { TaskPriority, TaskStatus } from '@/types/task.types';

export interface ITaskDocument extends Document {
  goal_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  estimated_duration: number; // minutes
  priority: TaskPriority;
  status: TaskStatus;
  scheduled_time: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    goal_id: { type: Schema.Types.ObjectId, ref: 'Goal', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, maxlength: 2000 },
    estimated_duration: { type: Number, required: true, min: 5, max: 480 },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'OVERDUE'],
      default: 'PENDING',
    },
    scheduled_time: { type: Date, required: true },
    completed_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Primary query pattern: fetch today's tasks for a user
TaskSchema.index({ user_id: 1, scheduled_time: 1, status: 1 });
TaskSchema.index({ goal_id: 1 });

export const Task =
  mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);
