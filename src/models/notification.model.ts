import mongoose, { Schema, Document } from 'mongoose';
import type { NotificationType } from '@/types/notification.types';

export interface INotificationDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  sent_at: Date;
  created_at: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['DAILY_MISSION', 'TASK_REMINDER', 'MISSED_TASK', 'STREAK_UPDATE', 'GOAL_MILESTONE', 'SYSTEM'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: null },
    read: { type: Boolean, default: false },
    sent_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

NotificationSchema.index({ user_id: 1, read: 1 });
NotificationSchema.index({ user_id: 1, created_at: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);
