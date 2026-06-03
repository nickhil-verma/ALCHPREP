import { GoalService } from './goal.service';
import { RoadmapRepository } from '@/repositories/roadmap.repository';
import { GoalRepository } from '@/repositories/goal.repository';
import { openai, AI_MODEL } from '@/lib/ai/client';
import { ROADMAP_GENERATION_PROMPT } from '@/lib/ai/prompts';
import { safeParseJSON } from '@/lib/ai/parser';
import { logger } from '@/lib/utils/logger';
import { ApiError } from '@/lib/utils/api-error';
import type { IRoadmapDocument, IMilestoneSubdoc } from '@/models/roadmap.model';

interface GeneratedMilestone {
  title: string;
  description: string;
  expected_days: number;
}

interface GeneratedRoadmapResponse {
  recommended_start_date: string;
  preparation_start_date: string;
  preparation_end_date: string;
  skill_gap_score: number;
  recommended_daily_hours: number;
  milestones: GeneratedMilestone[];
}

class RoadmapGeneratorServiceClass {
  /**
   * Generates a structured roadmap for an active goal using OpenAI/Gemini backward planning
   */
  async generateRoadmap(userId: string, goalId: string): Promise<IRoadmapDocument> {
    const goal = await GoalService.getGoalById(userId, goalId);

    logger.info(`Generating backward-planned roadmap for goal "${goal.title}" (ID: ${goalId})`);

    // Fetch prerequisite dependencies titles if any exist
    let dependenciesText = 'None';
    if (goal.goal_dependencies && goal.goal_dependencies.length > 0) {
      const depGoals = await GoalRepository.find({ _id: { $in: goal.goal_dependencies } });
      dependenciesText = depGoals.map((g) => `"${g.title}"`).join(', ');
    }

    const prompt = ROADMAP_GENERATION_PROMPT
      .replace('{goal_title}', goal.title)
      .replace('{goal_description}', goal.description)
      .replace('{deadline}', goal.deadline.toISOString().split('T')[0])
      .replace('{current_skill_level}', goal.current_skill_level || 'BEGINNER')
      .replace('{target_skill_level}', goal.target_skill_level || 'ADVANCED')
      .replace('{dependencies}', dependenciesText)
      .replace('{daily_hours}', goal.daily_hours.toString());

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

      const parsed = safeParseJSON<GeneratedRoadmapResponse>(rawResponse);

      if (!parsed.milestones || !Array.isArray(parsed.milestones)) {
        throw new Error('AI response did not match the expected milestone structure');
      }

      // Convert generated milestones to the schema structure, calculating sequential dates
      const milestones: IMilestoneSubdoc[] = [];
      let currentDate = parsed.recommended_start_date ? new Date(parsed.recommended_start_date) : new Date();

      for (let i = 0; i < parsed.milestones.length; i++) {
        const genMilestone = parsed.milestones[i];
        const days = genMilestone.expected_days || 7; // Default to 7 days if not provided
        
        currentDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);

        milestones.push({
          title: genMilestone.title,
          description: genMilestone.description,
          expected_completion_date: new Date(currentDate),
          status: i === 0 ? 'IN_PROGRESS' : 'PENDING', // Start the first milestone, others pending
          order: i + 1,
        });
      }

      // Save calculated AI timeline properties back to the goal document
      await GoalRepository.update(goalId, {
        goal_start_date: parsed.recommended_start_date ? new Date(parsed.recommended_start_date) : new Date(),
        recommended_start_date: parsed.recommended_start_date ? new Date(parsed.recommended_start_date) : new Date(),
        preparation_start_date: parsed.preparation_start_date ? new Date(parsed.preparation_start_date) : new Date(),
        preparation_end_date: parsed.preparation_end_date ? new Date(parsed.preparation_end_date) : new Date(),
        skill_gap_score: parsed.skill_gap_score || 5,
        recommended_daily_hours: parsed.recommended_daily_hours || goal.daily_hours || 2,
      });

      const roadmap = await RoadmapRepository.upsertByGoal(goalId, {
        goal_id: goal._id as any,
        user_id: goal.user_id as any,
        milestones,
        generated_at: new Date(),
      });

      logger.info(`Successfully generated roadmap with ${milestones.length} milestones for goal ${goalId}`);
      return roadmap;
    } catch (error) {
      logger.error('Error generating roadmap', error);
      throw new ApiError(
        `Failed to generate roadmap: ${(error as Error).message}`,
        500,
        'AI_GENERATION_FAILED'
      );
    }
  }
}

export const RoadmapGeneratorService = new RoadmapGeneratorServiceClass();
