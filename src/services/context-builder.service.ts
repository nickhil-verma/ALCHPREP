import { MemoryRepository } from '@/repositories/memory.repository';
import { GoalRepository } from '@/repositories/goal.repository';
import { TaskRepository } from '@/repositories/task.repository';
import { JournalRepository } from '@/repositories/journal.repository';
import { logger } from '@/lib/utils/logger';

class ContextBuilderServiceClass {
  /**
   * Aggregates memories, goals, recent tasks, and journals into a text context for the AI
   */
  async buildContext(userId: string): Promise<string> {
    try {
      logger.info(`Building AI context profile for user ${userId}`);

      // 1. Fetch memories with importance >= 5
      const memories = await MemoryRepository.findImportant(userId, 5);
      
      // 2. Fetch active goals
      const activeGoals = await GoalRepository.find({ user_id: userId, status: 'ACTIVE' });
      
      // 3. Fetch tasks completed in the last 3 days
      const recentTasks = await TaskRepository.findRecentCompleted(userId, 3);
      
      // 4. Fetch journals from the last 3 days
      const recentJournals = await JournalRepository.findRecent(userId, 3);

      // Build context components
      let contextStr = '=== USER PROFILE & HISTORY CONTEXT ===\n\n';

      // Memories section
      contextStr += '## CORE MEMORIES & OBSERVATIONS:\n';
      if (memories.length > 0) {
        memories.forEach((mem) => {
          contextStr += `- ${mem.content} [Importance: ${mem.importance_score}/10, Category: ${mem.category || 'general'}]\n`;
        });
      } else {
        contextStr += '- No core memories established yet.\n';
      }
      contextStr += '\n';

      // Goals section
      contextStr += '## ACTIVE GOALS:\n';
      if (activeGoals.length > 0) {
        activeGoals.forEach((goal) => {
          contextStr += `- "${goal.title}": ${goal.description}. Current progress: ${goal.progress_percentage}%. Deadline: ${goal.deadline.toISOString().split('T')[0]}. Priority: ${goal.priority}.\n`;
        });
      } else {
        contextStr += '- No active goals registered.\n';
      }
      contextStr += '\n';

      // Achievements section
      contextStr += '## RECENT ACHIEVEMENTS (Completed Tasks in last 3 days):\n';
      if (recentTasks.length > 0) {
        recentTasks.forEach((task) => {
          contextStr += `- Completed: "${task.title}" (Duration: ${task.estimated_duration} mins) on ${new Date(task.completed_at!).toDateString()}\n`;
        });
      } else {
        contextStr += '- No tasks completed recently.\n';
      }
      contextStr += '\n';

      // Journals section
      contextStr += '## RECENT REFLECTIONS & JOURNAL ENTRY THOUGHTS (Last 3 days):\n';
      if (recentJournals.length > 0) {
        recentJournals.forEach((journal) => {
          // Truncate journal content if too long for prompt size constraints
          const snippet = journal.content.length > 300 ? journal.content.substring(0, 300) + '...' : journal.content;
          contextStr += `- Date: ${new Date(journal.created_at).toDateString()} (Mood: ${journal.mood})\n  Thoughts: "${snippet}"\n`;
        });
      } else {
        contextStr += '- No recent journal reflections logged.\n';
      }

      return contextStr;
    } catch (error) {
      logger.error('Error building AI context', error);
      return 'Failed to load user context. Respond generically, but keep the supportive mentor persona.';
    }
  }
}

export const ContextBuilderService = new ContextBuilderServiceClass();
