// ============================================
// Roadmap Types
// ============================================

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface IMilestone {
  title: string;
  description: string;
  expected_completion_date: Date;
  status: MilestoneStatus;
  order: number;
}

export interface IRoadmap {
  _id: string;
  goal_id: string;
  user_id: string;
  milestones: IMilestone[];
  generated_at: Date;
  updated_at: Date;
}

export interface GenerateRoadmapRequest {
  goal_id: string;
}
