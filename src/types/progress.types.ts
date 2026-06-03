// ============================================
// Progress Types
// ============================================

export interface GoalProgressEntry {
  goal_id: string;
  goal_title: string;
  completion_percentage: number;
  tasks_completed: number;
  tasks_total: number;
}

export interface IProgressSnapshot {
  _id: string;
  user_id: string;
  date: Date;
  daily_completion: number;   // 0-100
  weekly_completion: number;  // 0-100
  streak: number;
  goal_progress: GoalProgressEntry[];
  total_tasks_completed: number;
  total_study_minutes: number;
  tasks_completed: number;
  tasks_total: number;
  created_at: Date;
}
