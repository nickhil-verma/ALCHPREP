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
      // 1. Fetch active goals first
      const goals = await GoalRepository.find({ user_id: userId, status: 'ACTIVE' }, { sort: { deadline: 1 } });

      // Auto-generate daily tasks for each active goal if they do not exist for today yet
      const { TaskGeneratorService } = require('./task-generator.service');
      await Promise.all(
        goals.map(async (goal: any) => {
          try {
            await TaskGeneratorService.generateDailyTasks(userId, goal._id.toString());
          } catch (err) {
            logger.error(`Failed to auto-generate daily tasks for goal ${goal._id}`, err);
          }
        })
      );

      // 2. Fetch the remaining dashboard aggregation data in parallel
      const [
        todayTasks,
        streak,
        weeklyCompletionRate,
        githubStats,
        recentJournals,
        calendarEvents,
        notifications,
      ] = await Promise.all([
        // Fetch scheduled tasks for today (includes the newly auto-generated ones)
        TaskRepository.findTodayTasks(userId),

        // Calculate habit streak
        ProgressRepository.getStreak(userId),

        // Calculate weekly completion rate
        ProgressRepository.getWeeklyAverage(userId),

        // Fetch recent GitHub activity
        GithubStatsRepository.findByUser(userId),

        // Fetch last 5 journal entries
        JournalRepository.findByUser(userId, 5),

        // Fetch upcoming calendar events
        CalendarEventRepository.findUpcoming(userId, 5),

        // Fetch last 5 notifications
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
