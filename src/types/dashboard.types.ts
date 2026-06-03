// ============================================
// Dashboard Types
// ============================================

import type { GoalProgressEntry } from './progress.types';
import type { ITask } from './task.types';

export interface DashboardData {
  goalProgress: GoalProgressEntry[];
  productivityStats: ProductivityStats;
  weeklyCompletion: WeeklyCompletionData;
  currentStreak: number;
  upcomingTasks: ITask[];
}

export interface ProductivityStats {
  tasks_completed_today: number;
  tasks_completed_week: number;
  total_study_hours_today: number;
  total_study_hours_week: number;
  efficiency_rate: number; // completed / total scheduled
}

export interface WeeklyCompletionData {
  days: DayCompletion[];
  average: number;
}

export interface DayCompletion {
  date: string;
  completed: number;
  total: number;
  percentage: number;
}
