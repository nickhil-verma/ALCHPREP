// ============================================
// Goal Types
// ============================================

export type GoalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';

export interface IGoal {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  deadline: Date;
  priority: GoalPriority;
  status: GoalStatus;
  daily_hours: number;
  progress_percentage: number;
  tags?: string[];
  goal_start_date?: Date;
  recommended_start_date?: Date;
  preparation_start_date?: Date;
  preparation_end_date?: Date;
  current_skill_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  target_skill_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  skill_gap_score?: number;
  recommended_daily_hours?: number;
  goal_dependencies?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateGoalRequest {
  title: string;
  description: string;
  deadline: string;
  priority: GoalPriority;
  daily_hours: number;
  tags?: string[];
  current_skill_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  target_skill_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  goal_dependencies?: string[];
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  deadline?: string;
  priority?: GoalPriority;
  status?: GoalStatus;
  daily_hours?: number;
  progress_percentage?: number;
  tags?: string[];
  current_skill_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  target_skill_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  goal_dependencies?: string[];
}
