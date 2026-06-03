// ============================================
// Task Types
// ============================================

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'OVERDUE';

export interface ITask {
  _id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description: string;
  estimated_duration: number; // in minutes
  priority: TaskPriority;
  status: TaskStatus;
  scheduled_time: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface GenerateTasksRequest {
  goal_id: string;
  date?: string; // ISO date, defaults to today
}

export interface UpdateTaskRequest {
  status?: TaskStatus;
  completed_at?: string;
}
