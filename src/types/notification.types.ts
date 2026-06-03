// ============================================
// Notification Types
// ============================================

export type NotificationType =
  | 'DAILY_MISSION'
  | 'TASK_REMINDER'
  | 'MISSED_TASK'
  | 'STREAK_UPDATE'
  | 'GOAL_MILESTONE'
  | 'SYSTEM';

export interface INotification {
  _id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  sent_at: Date;
  created_at: Date;
}

export interface IDeviceToken {
  _id: string;
  user_id: string;
  token: string;
  platform: 'WEB' | 'ANDROID' | 'IOS';
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RegisterTokenRequest {
  token: string;
  platform: 'WEB' | 'ANDROID' | 'IOS';
}

export interface SendNotificationRequest {
  user_id?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}
