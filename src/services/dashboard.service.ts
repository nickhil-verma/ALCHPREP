import { GoalRepository } from '@/repositories/goal.repository';
import { TaskRepository } from '@/repositories/task.repository';
import { ProgressRepository } from '@/repositories/progress.repository';
import { GithubStatsRepository } from '@/repositories/github-stats.repository';
import { JournalRepository } from '@/repositories/journal.repository';
import { CalendarEventRepository } from '@/repositories/calendar-event.repository';
import { NotificationRepository } from '@/repositories/notification.repository';
import { logger } from '@/lib/utils/logger';

class DashboardServiceClass {
  /**
   * Aggregates all dashboard view data for a user in a single request, executing queries in parallel.
   */
  async getDashboardData(userId: string) {
    logger.info(`Fetching dashboard aggregation data for user ${userId}`);

    try {
      const [
        goals,
        todayTasks,
        streak,
        weeklyCompletionRate,
        githubStats,
        recentJournals,
        calendarEvents,
        notifications,
      ] = await Promise.all([
        // 1. Fetch active goals
        GoalRepository.find({ user_id: userId, status: 'ACTIVE' }, { sort: { deadline: 1 } }),

        // 2. Fetch scheduled tasks for today
        TaskRepository.findTodayTasks(userId),

        // 3. Calculate habit streak
        ProgressRepository.getStreak(userId),

        // 4. Calculate weekly completion rate
        ProgressRepository.getWeeklyAverage(userId),

        // 5. Fetch recent GitHub activity
        GithubStatsRepository.findByUser(userId),

        // 6. Fetch last 5 journal entries
        JournalRepository.findByUser(userId, 5),

        // 7. Fetch upcoming calendar events
        CalendarEventRepository.findUpcoming(userId, 5),

        // 8. Fetch last 5 notifications
        NotificationRepository.find({ user_id: userId }, { sort: { created_at: -1 }, limit: 5 }),
      ]);

      const { GoalTimelineService } = require('./goal-timeline.service');
      const goalsWithMetrics = goals.map((goal: any) => {
        const metrics = GoalTimelineService.calculateMetrics(goal);
        return {
          ...(goal.toObject ? goal.toObject() : goal),
          metrics,
        };
      });

      // topGoals: Top 3 goals sorted by Priority Score descending
      const topGoals = [...goalsWithMetrics]
        .sort((a, b) => b.metrics.priorityScore - a.metrics.priorityScore)
        .slice(0, 3);

      // approachingGoals: Sorted by urgency (CRITICAL > BEHIND > SLIGHTLY_BEHIND > ON_TRACK), then by days remaining ascending
      const urgencyMap: Record<string, number> = { CRITICAL: 4, BEHIND: 3, SLIGHTLY_BEHIND: 2, ON_TRACK: 1 };
      const approachingGoals = [...goalsWithMetrics].sort((a, b) => {
        const urgencyDiff = urgencyMap[b.metrics.urgencyStatus] - urgencyMap[a.metrics.urgencyStatus];
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.metrics.daysRemaining - b.metrics.daysRemaining;
      });

      return {
        goals: goalsWithMetrics,
        topGoals,
        approachingGoals,
        todayTasks,
        stats: {
          streak,
          weeklyCompletionRate,
        },
        githubStats,
        recentJournals,
        calendarEvents,
        notifications,
      };
    } catch (error) {
      logger.error(`Failed to compile dashboard data for user ${userId}`, error);
      throw new Error(`Failed to compile dashboard data: ${(error as Error).message}`);
    }
  }
}

export const DashboardService = new DashboardServiceClass();
