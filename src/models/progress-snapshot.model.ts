import mongoose, { Schema, Document } from 'mongoose';

export interface IGoalProgressEntry {
  goal_id: mongoose.Types.ObjectId;
  goal_title: string;
  completion_percentage: number;
  tasks_completed: number;
  tasks_total: number;
}

export interface IProgressSnapshotDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  date: Date;
  daily_completion: number;
  weekly_completion: number;
  streak: number;
  goal_progress: IGoalProgressEntry[];
  total_tasks_completed: number;
  total_study_minutes: number;
  tasks_completed: number;
  tasks_total: number;
  created_at: Date;
}

const GoalProgressEntrySchema = new Schema<IGoalProgressEntry>(
  {
    goal_id: { type: Schema.Types.ObjectId, ref: 'Goal', required: true },
    goal_title: { type: String, required: true },
    completion_percentage: { type: Number, default: 0 },
    tasks_completed: { type: Number, default: 0 },
    tasks_total: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProgressSnapshotSchema = new Schema<IProgressSnapshotDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    daily_completion: { type: Number, default: 0, min: 0, max: 100 },
    weekly_completion: { type: Number, default: 0, min: 0, max: 100 },
    streak: { type: Number, default: 0 },
    goal_progress: [GoalProgressEntrySchema],
    total_tasks_completed: { type: Number, default: 0 },
    total_study_minutes: { type: Number, default: 0 },
    tasks_completed: { type: Number, default: 0 },
    tasks_total: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// One snapshot per user per day
ProgressSnapshotSchema.index({ user_id: 1, date: 1 }, { unique: true });

export const ProgressSnapshot =
  mongoose.models.ProgressSnapshot ||
  mongoose.model<IProgressSnapshotDocument>('ProgressSnapshot', ProgressSnapshotSchema);
