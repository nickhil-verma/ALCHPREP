import { UserRepository } from '@/repositories/user.repository';
import { GoalRepository } from '@/repositories/goal.repository';
import { TaskRepository } from '@/repositories/task.repository';
import { ProgressRepository } from '@/repositories/progress.repository';
import { TaskGeneratorService } from './task-generator.service';
import { NotificationService } from './notification.service';
import { logger } from '@/lib/utils/logger';

class CronServiceClass {
  /**
   * Daily Planner Job: Runs early morning.
   * Generates daily tasks for all active goals and sends plan summaries.
   */
  async runDailyPlanner(): Promise<void> {
    logger.info('Starting Cron Job: Daily Planner');
    const users = await UserRepository.find({});

    for (const user of users) {
      const userId = user._id.toString();
      try {
        const activeGoals = await GoalRepository.find({ user_id: userId, status: 'ACTIVE' });
        if (activeGoals.length === 0) continue;

        let totalGeneratedTasks = 0;

        for (const goal of activeGoals) {
          const tasks = await TaskGeneratorService.generateDailyTasks(userId, goal._id.toString());
          totalGeneratedTasks += tasks.length;
        }

        if (totalGeneratedTasks > 0 && user.notification_preferences.daily_mission) {
          await NotificationService.sendNotification(
            userId,
            'DAILY_MISSION',
            'Your Daily Mission is Ready! 🚀',
            `We have scheduled ${totalGeneratedTasks} tasks for you today to make progress on your goals. Let's get started!`
          );
        }
      } catch (error) {
        logger.error(`Error in Daily Planner cron for user ${userId}`, error);
      }
    }
    logger.info('Completed Cron Job: Daily Planner');
  }

  /**
   * Task Reminders Job: Runs mid-day.
   * Reminds users of any pending tasks scheduled for today.
   */
  async runReminders(): Promise<void> {
    logger.info('Starting Cron Job: Task Reminders');
    const users = await UserRepository.find({});

    for (const user of users) {
      const userId = user._id.toString();
      try {
        const activeGoals = await GoalRepository.find({ user_id: userId, status: 'ACTIVE' });

        // 1. Task Reminders (if preference is enabled)
        if (user.notification_preferences.task_reminder) {
          const todayTasks = await TaskRepository.findTodayTasks(userId);
          const pendingTasks = todayTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');

          if (pendingTasks.length > 0) {
            const taskNames = pendingTasks.map((t) => t.title).join(', ');
            const title = pendingTasks.length === 1 ? 'Task Reminder ⏰' : 'You have pending tasks today!';
            const body = pendingTasks.length === 1
              ? `Don't forget to work on: "${pendingTasks[0].title}" today.`
              : `You have ${pendingTasks.length} pending tasks: ${taskNames.substring(0, 60)}...`;

            await NotificationService.sendNotification(userId, 'TASK_REMINDER', title, body);
          }
        }

        // 2. Smart Reminders for Goal Preparation Windows
        const now = new Date();
        for (const goal of activeGoals) {
          if (goal.preparation_start_date) {
            const prepStart = new Date(goal.preparation_start_date);
            const diffDays = (prepStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            // If preparation is starting soon (within next 3 days) and has not passed yet
            if (diffDays >= 0 && diffDays <= 3) {
              await NotificationService.sendNotification(
                userId,
                'TASK_REMINDER',
                '⚠️ Goal Preparation Window Starting',
                `Goal: ${goal.title}. AI recommends beginning preparation / open-source contributions this week. Suggested actions: 1. Select 3 organizations, 2. Fix first issue, 3. Create contribution roadmap.`
              );
            }
          }
        }

      } catch (error) {
        logger.error(`Error in Task Reminders cron for user ${userId}`, error);
      }
    }
    logger.info('Completed Cron Job: Task Reminders');
  }

  /**
   * Progress Analysis Job: Runs end of day.
   * Evaluates streaks and marks overdue tasks.
   */
  async runProgressAnalysis(): Promise<void> {
    logger.info('Starting Cron Job: Progress Analysis');
    const users = await UserRepository.find({});

    for (const user of users) {
      const userId = user._id.toString();
      try {
        // 1. Mark overdue tasks
        await TaskRepository.markOverdue(userId);

        // 2. Fetch today's tasks to compute final completion percentage
        const todayTasks = await TaskRepository.findTodayTasks(userId);
        const total = todayTasks.length;
        const completed = todayTasks.filter((t) => t.status === 'COMPLETED').length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // 3. Upsert today's final snapshot
        await ProgressRepository.upsertToday(userId, {
          daily_completion: percentage,
          tasks_completed: completed,
          tasks_total: total,
        });

        // 4. Check streak achievements
        const currentStreak = await ProgressRepository.getStreak(userId);
        
        if (currentStreak > 0 && currentStreak % 3 === 0 && user.notification_preferences.streak_update) {
          // Send streak milestone notifications at 3, 6, 9 days etc.
          await NotificationService.sendNotification(
            userId,
            'STREAK_UPDATE',
            'You are on fire! 🔥',
            `Congratulations! You have kept your daily habit streak going for ${currentStreak} days straight!`
          );
        }
      } catch (error) {
        logger.error(`Error in Progress Analysis cron for user ${userId}`, error);
      }
    }
    logger.info('Completed Cron Job: Progress Analysis');
  }
}

export const CronService = new CronServiceClass();
