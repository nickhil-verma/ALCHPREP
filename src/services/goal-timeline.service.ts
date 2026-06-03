import { IGoalDocument } from '@/models/goal.model';

export interface GoalTimelineMetrics {
  urgencyStatus: 'ON_TRACK' | 'SLIGHTLY_BEHIND' | 'BEHIND' | 'CRITICAL';
  priorityScore: number;
  expectedProgress: number;
  daysRemaining: number;
  recommendation: string;
}

class GoalTimelineServiceClass {
  /**
   * Calculates dynamic metrics for a goal, including its urgency status, expected progress, and priority score.
   */
  calculateMetrics(goal: IGoalDocument): GoalTimelineMetrics {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    
    // Days remaining
    const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Fallbacks if AI timeline variables are not generated yet
    const recommendedStart = goal.recommended_start_date ? new Date(goal.recommended_start_date) : new Date(goal.created_at || now);
    
    // Expected progress calculation: linear progress between recommendedStart and deadline
    let expectedProgress = 0;
    const totalDuration = deadline.getTime() - recommendedStart.getTime();
    if (totalDuration > 0) {
      const elapsed = now.getTime() - recommendedStart.getTime();
      expectedProgress = Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));
    }

    const currentProgress = goal.progress_percentage || 0;
    const progressGap = expectedProgress - currentProgress;

    // Urgency Status calculation
    let urgencyStatus: 'ON_TRACK' | 'SLIGHTLY_BEHIND' | 'BEHIND' | 'CRITICAL' = 'ON_TRACK';
    if (now > deadline && currentProgress < 100) {
      urgencyStatus = 'CRITICAL';
    } else if (progressGap > 35) {
      urgencyStatus = 'CRITICAL';
    } else if (progressGap > 15) {
      urgencyStatus = 'BEHIND';
    } else if (progressGap > 0) {
      urgencyStatus = 'SLIGHTLY_BEHIND';
    }

    // Dynamic Recommendation
    let recommendation = 'Keep up the great work! You are currently meeting your study schedule.';
    const dailyHours = goal.daily_hours || 2;
    if (urgencyStatus === 'SLIGHTLY_BEHIND') {
      recommendation = `Increase study focus slightly. Add 1 hour to your daily schedule.`;
    } else if (urgencyStatus === 'BEHIND') {
      recommendation = `Increase preparation from ${dailyHours}h/day to ${dailyHours + 2}h/day.`;
    } else if (urgencyStatus === 'CRITICAL') {
      recommendation = `Increase preparation from ${dailyHours}h/day to ${Math.min(16, dailyHours * 2)}h/day immediately.`;
    }

    // Priority Score formula factors
    const progressWeight = 100 - currentProgress; // 0 to 100
    const skillGapWeight = (goal.skill_gap_score || 1) * 10; // 10 to 100
    const priorityWeight = { CRITICAL: 100, HIGH: 60, MEDIUM: 30, LOW: 10 }[goal.priority || 'MEDIUM'];
    
    // Time urgency multiplier (fewer days remaining -> higher score)
    const daysFactor = daysRemaining <= 0 ? 500 : Math.min(500, Math.round(500 / (daysRemaining + 1)));

    const priorityScore = Math.round(
      (progressWeight * 0.3) + 
      (skillGapWeight * 0.2) + 
      (priorityWeight * 0.2) + 
      (daysFactor * 0.3)
    );

    return {
      urgencyStatus,
      priorityScore,
      expectedProgress,
      daysRemaining,
      recommendation,
    };
  }
}

export const GoalTimelineService = new GoalTimelineServiceClass();
