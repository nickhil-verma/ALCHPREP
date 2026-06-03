import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password_hash: string;
  avatar?: string;
  timezone: string;
  notification_preferences: {
    daily_mission: boolean;
    task_reminder: boolean;
    missed_task: boolean;
    streak_update: boolean;
  };
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password_hash: { type: String, required: true },
    avatar: { type: String, default: null },
    timezone: { type: String, default: 'UTC' },
    notification_preferences: {
      daily_mission: { type: Boolean, default: true },
      task_reminder: { type: Boolean, default: true },
      missed_task: { type: Boolean, default: true },
      streak_update: { type: Boolean, default: true },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password_hash;
        return ret;
      },
    },
  }
);

export const User =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
