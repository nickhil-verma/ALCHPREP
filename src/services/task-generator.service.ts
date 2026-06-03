import { GoalService } from './goal.service';
import { RoadmapRepository } from '@/repositories/roadmap.repository';
import { TaskRepository } from '@/repositories/task.repository';
import { RoadmapGeneratorService } from './roadmap-generator.service';
import { openai, AI_MODEL } from '@/lib/ai/client';
import { TASK_GENERATION_PROMPT } from '@/lib/ai/prompts';
import { safeParseJSON } from '@/lib/ai/parser';
import { logger } from '@/lib/utils/logger';
import { ApiError } from '@/lib/utils/api-error';
import { startOfToday, endOfToday } from '@/lib/utils/date';
import type { ITaskDocument } from '@/models/task.model';
import type { TaskPriority } from '@/types/task.types';

// Declare a placeholder/empty context builder that we will implement fully in Phase 6
let getContextForUser: (userId: string) => Promise<string>;
try {
  const { ContextBuilderService } = require('./context-builder.service');
  getContextForUser = (userId) => ContextBuilderService.buildContext(userId);
} catch {
  getContextForUser = async () => 'No previous history context available.';
}

interface GeneratedTask {
  title: string;
  description: string;
  estimated_duration: number;
  priority: TaskPriority;
}

interface GeneratedTasksResponse {
  tasks: GeneratedTask[];
}

class TaskGeneratorServiceClass {
  /**
   * Generates and schedules a set of daily tasks for a user's goal
   */
  async generateDailyTasks(
    userId: string,
    goalId: string,
    targetDateStr?: string
  ): Promise<ITaskDocument[]> {
    const goal = await GoalService.getGoalById(userId, goalId);

    // Get or generate roadmap
    let roadmap = await RoadmapRepository.findByGoal(goalId);
    if (!roadmap) {
      logger.info(`Roadmap not found for goal ${goalId}. Generating roadmap first...`);
      roadmap = await RoadmapGeneratorService.generateRoadmap(userId, goalId);
    }

    // Find the active milestone (first PENDING or IN_PROGRESS)
    const activeMilestone =
      roadmap.milestones.find((m) => m.status === 'IN_PROGRESS') ||
      roadmap.milestones.find((m) => m.status === 'PENDING') ||
      roadmap.milestones[roadmap.milestones.length - 1]; // Fallback to last milestone

    if (!activeMilestone) {
      throw new ApiError('No active milestone found to base tasks on', 400, 'NO_ACTIVE_MILESTONE');
    }

    const targetDate = targetDateStr ? new Date(targetDateStr) : startOfToday();
    
    // Check if tasks were already generated for this goal on the target date
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingTasks = await TaskRepository.find({
      goal_id: goalId,
      user_id: userId,
      scheduled_time: { $gte: dayStart, $lte: dayEnd },
    });

    if (existingTasks.length > 0) {
      logger.info(`Tasks already exist for goal ${goalId} on date ${targetDate.toDateString()}`);
      return existingTasks;
    }

    // Fetch memory/context
    const context = await getContextForUser(userId);

    const prompt = TASK_GENERATION_PROMPT
      .replace('{goal_title}', goal.title)
      .replace('{goal_description}', goal.description)
      .replace('{milestone_title}', activeMilestone.title)
      .replace('{milestone_description}', activeMilestone.description)
      .replace('{date}', targetDate.toISOString().split('T')[0])
      .replace('{current_skill_level}', goal.current_skill_level || 'BEGINNER')
      .replace('{target_skill_level}', goal.target_skill_level || 'ADVANCED')
      .replace('{preparation_start_date}', goal.preparation_start_date ? goal.preparation_start_date.toISOString().split('T')[0] : 'N/A')
      .replace('{preparation_end_date}', goal.preparation_end_date ? goal.preparation_end_date.toISOString().split('T')[0] : 'N/A')
      .replace('{recommended_daily_hours}', (goal.recommended_daily_hours || goal.daily_hours || 2).toString())
      .replace('{memory_context}', context);

    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const rawResponse = completion.choices[0]?.message?.content;
      if (!rawResponse) {
        throw new Error('AI returned an empty response');
      }

      const parsed = safeParseJSON<GeneratedTasksResponse>(rawResponse);

      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('AI response did not match the expected task list structure');
      }

      const tasksToCreate = parsed.tasks.map((task) => ({
        goal_id: goal._id as any,
        user_id: goal.user_id as any,
        title: task.title,
        description: task.description,
        estimated_duration: task.estimated_duration || 60,
        priority: task.priority || 'MEDIUM',
        status: 'PENDING' as const,
        scheduled_time: targetDate,
      }));

      const createdTasks: ITaskDocument[] = [];
      for (const taskData of tasksToCreate) {
        const created = await TaskRepository.create(taskData);
        createdTasks.push(created);
      }

      // Update milestone status to IN_PROGRESS if it was PENDING
      if (activeMilestone.status === 'PENDING') {
        const milestoneIndex = roadmap.milestones.findIndex(
          (m) => m.title === activeMilestone.title
        );
        if (milestoneIndex !== -1) {
          await RoadmapRepository.updateMilestoneStatus(goalId, milestoneIndex, 'IN_PROGRESS');
        }
      }

      // Trigger goal progress update (total tasks changed, so update percentage)
      await GoalService.updateGoalProgress(goalId);

      logger.info(
        `Successfully generated and scheduled ${createdTasks.length} tasks for date ${targetDate.toDateString()}`
      );
      return createdTasks;
    } catch (error) {
      logger.error('Error generating daily tasks', error);
      throw new ApiError(
        `Failed to generate daily tasks: ${(error as Error).message}`,
        500,
        'AI_GENERATION_FAILED'
      );
    }
  }
}

export const TaskGeneratorService = new TaskGeneratorServiceClass();
export { getContextForUser };
