import { ProgressRepository } from '@/repositories/progress.repository';
import { GoalRepository } from '@/repositories/goal.repository';
import { TaskRepository } from '@/repositories/task.repository';
import { JournalRepository } from '@/repositories/journal.repository';
import { GithubStatsRepository } from '@/repositories/github-stats.repository';
import { MemoryRepository } from '@/repositories/memory.repository';
import { openai, AI_MODEL } from '@/lib/ai/client';
import { logger } from '@/lib/utils/logger';
import { daysAgo } from '@/lib/utils/date';
import { ApiError } from '@/lib/utils/api-error';

class ProgressAnalyzerServiceClass {
  /**
   * Generates a weekly accountability report, saves it to the memory bank, and returns it.
   */
  async generateWeeklyReport(userId: string): Promise<{
    start_date: Date;
    end_date: Date;
    tasks_completed: number;
    tasks_total: number;
    completion_rate: number;
    current_streak: number;
    report_content: string;
  }> {
    logger.info(`Analyzing weekly progress and generating report for user ${userId}`);

    const start = daysAgo(7);
    const end = new Date();

    // 1. Fetch metrics
    const snapshots = await ProgressRepository.findByDateRange(userId, start, end);
    const activeGoals = await GoalRepository.find({ user_id: userId, status: 'ACTIVE' });
    const completedTasks = await TaskRepository.findRecentCompleted(userId, 7);
    const recentJournals = await JournalRepository.findRecent(userId, 7);
    const githubStats = await GithubStatsRepository.findByUser(userId);
    const currentStreak = await ProgressRepository.getStreak(userId);

    // Compute completion aggregates
    let totalTasksScheduled = 0;
    let totalTasksCompleted = 0;

    snapshots.forEach((snap) => {
      totalTasksScheduled += snap.tasks_total || 0;
      totalTasksCompleted += snap.tasks_completed || 0;
    });

    const completionRate = totalTasksScheduled > 0
      ? Math.round((totalTasksCompleted / totalTasksScheduled) * 100)
      : 0;

    // 2. Draft AI prompt inputs
    const goalsSummary = activeGoals
      .map((g) => `- Goal: "${g.title}" (${g.progress_percentage}% completed)`)
      .join('\n') || '- No active goals this week.';

    const taskNames = completedTasks.map((t) => `- Completed: "${t.title}"`).join('\n') || '- No tasks completed.';
    
    const journalMoods = recentJournals
      .map((j) => `- Day Mood: ${j.mood} | Thoughts snippet: "${j.content.substring(0, 100)}..."`)
      .join('\n') || '- No journals written.';

    let githubSummary = '- No GitHub activity synced.';
    if (githubStats && githubStats.activity_snapshots && githubStats.activity_snapshots.length > 0) {
      githubSummary = githubStats.activity_snapshots
        .slice(0, 7)
        .map((snap) => `- Date: ${new Date(snap.date).toDateString()} | Commits: ${snap.commits_count}`)
        .join('\n');
    }

    const systemPrompt = `
You are an elite Performance Coach. Generate a comprehensive Weekly Accountability Report for the user.

Analyze the user's progress metrics for the past week:
- Active Goals:\n${goalsSummary}
- Tasks Completed this week:\n${taskNames}
- Daily Completion rate: ${completionRate}%
- Daily Habit Streak: ${currentStreak} days
- Journal Mood & Qualitative reflections:\n${journalMoods}
- GitHub coding statistics:\n${githubSummary}

Structure the report using markdown with the following sections:
### 1. Weekly Performance Summary
(Synthesize how they did, whether they met their goals, what went well, and their psychological/mood states)

### 2. Highs & Achievements
(Specifically highlight goals/tasks checked off, streaks, or GitHub activity)

### 3. Obstacles & Areas to Improve
(Highlight missed deadlines, bad mood triggers, low task completion rates, or inconsistencies)

### 4. Strategic Actions for Next Week
(Give 2-3 specific, actionable recommendations for next week)

Keep the tone direct, analytical, but encouraging. Be extremely objective. Do not repeat numbers without context.
`;

    try {
      // 3. Call AI
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.7,
      });

      const reportContent = completion.choices[0]?.message?.content;
      if (!reportContent) {
        throw new Error('AI returned empty report content');
      }

      // 4. Save report summary into long-term memory
      const memoryContent = `Weekly Accountability Report (${start.toDateString()} - ${end.toDateString()}): Completion rate was ${completionRate}%. Streak is ${currentStreak} days. Coach advice summary: ${reportContent.substring(0, 400)}...`;
      
      await MemoryRepository.create({
        user_id: userId as any,
        type: 'MEDIUM',
        content: memoryContent,
        importance_score: 8, // High importance
        source: 'weekly-progress-analysis',
        category: 'WEEKLY_REPORT_SUMMARY',
      });

      logger.info(`Successfully generated weekly report for user ${userId} and saved to memory bank.`);

      return {
        start_date: start,
        end_date: end,
        tasks_completed: totalTasksCompleted,
        tasks_total: totalTasksScheduled,
        completion_rate: completionRate,
        current_streak: currentStreak,
        report_content: reportContent,
      };
    } catch (error) {
      logger.error('Error generating weekly accountability report', error);
      throw new ApiError(
        `Failed to compile accountability report: ${(error as Error).message}`,
        500,
        'REPORT_GENERATION_FAILED'
      );
    }
  }
}

export const ProgressAnalyzerService = new ProgressAnalyzerServiceClass();
