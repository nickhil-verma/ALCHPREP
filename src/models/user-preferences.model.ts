import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferencesDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  language: string;
  ai_personality: 'STRICT' | 'FRIENDLY' | 'MOTIVATIONAL' | 'ANALYTICAL';
  daily_goal_hours: number;
  preferred_study_time: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  weekly_report_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferencesDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    ai_personality: {
      type: String,
      enum: ['STRICT', 'FRIENDLY', 'MOTIVATIONAL', 'ANALYTICAL'],
      default: 'MOTIVATIONAL',
    },
    daily_goal_hours: { type: Number, default: 4, min: 1, max: 16 },
    preferred_study_time: {
      type: String,
      enum: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'],
      default: 'MORNING',
    },
    weekly_report_enabled: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const UserPreferences =
  mongoose.models.UserPreferences ||
  mongoose.model<IUserPreferencesDocument>('UserPreferences', UserPreferencesSchema);
