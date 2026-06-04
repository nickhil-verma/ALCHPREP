import { AIConversationRepository } from '@/repositories/ai-conversation.repository';
import { UserPreferencesRepository } from '@/repositories/user-preferences.repository';
import { UserRepository } from '@/repositories/user.repository';
import { GoalRepository } from '@/repositories/goal.repository';
import { openai, AI_MODEL } from '@/lib/ai/client';
import { MENTOR_CHAT_PROMPT, MENTOR_EVALUATION_PROMPT } from '@/lib/ai/prompts';
import { logger } from '@/lib/utils/logger';
import { ApiError } from '@/lib/utils/api-error';
import type { AIMessage } from '@/types/ai.types';

// Declare a placeholder/empty context builder that we will implement fully in Phase 6
let getContextForUser: (userId: string) => Promise<string>;
try {
  const { ContextBuilderService } = require('./context-builder.service');
  getContextForUser = (userId) => ContextBuilderService.buildContext(userId);
} catch {
  getContextForUser = async () => 'No previous history context available.';
}

const PERSONALITY_MAP = {
  STRICT: {
    name: 'Marcus Aurelius (Strict)',
    description: 'Demanding, direct, values absolute discipline, zero tolerance for excuses, holds you extremely accountable.',
  },
  FRIENDLY: {
    name: 'Ted Lasso (Friendly)',
    description: 'Empathetic, kind, highly supportive, listens deeply, validating, focuses on emotional well-being.',
  },
  MOTIVATIONAL: {
    name: 'Tony Robbins (Motivational)',
    description: 'High-energy, inspirational, action-oriented, encourages building streaks and daily momentum.',
  },
  ANALYTICAL: {
    name: 'Andrew Huberman (Analytical)',
    description: 'Logical, scientific, system-oriented, relies on data, metrics, physiological optimization, and cognitive systems.',
  },
};

class MentorChatServiceClass {
  /**
   * Sends a message to the AI Mentor, returns the mentor's response, and maintains conversation state.
   */
  async sendMessage(
    userId: string,
    messageContent: string,
    contextType: 'MENTOR' | 'ROADMAP' | 'TASK' | 'JOURNAL' | 'PROGRESS' = 'MENTOR',
    goalId?: string
  ): Promise<string> {
    logger.info(`Routing chat message for user ${userId} under context ${contextType}`);

    // 1. Fetch latest conversation or create one
    let conversation = await AIConversationRepository.findLatest(userId, contextType, goalId);
    if (!conversation) {
      conversation = await AIConversationRepository.createConversation(userId, contextType, goalId);
    }

    // 2. Add user message to DB first
    const userMessage: AIMessage = { role: 'user', content: messageContent };
    await AIConversationRepository.addMessage(conversation._id.toString(), userMessage);

    // 3. Fetch user details and active goals
    const user = await UserRepository.findById(userId);
    const userPrefs = await UserPreferencesRepository.findOrCreate(userId);
    const activeGoals = await GoalRepository.find({ user_id: userId, status: 'ACTIVE' });
    
    const goalsSummary = activeGoals.map((g) => `Goal: ${g.title} (Progress: ${g.progress_percentage}%)`).join('; ') || 'No active goals set.';

    const personalityKey = userPrefs.ai_personality || 'MOTIVATIONAL';
    const personality = PERSONALITY_MAP[personalityKey] || PERSONALITY_MAP.MOTIVATIONAL;

    // 4. Fetch memory context
    const memoryContext = await getContextForUser(userId);

    // 5. Construct System Prompt
    const systemPrompt = MENTOR_CHAT_PROMPT
      .replace('{mentor_name}', personality.name)
      .replace('{personality}', personalityKey.toLowerCase())
      .replace('{personality_description}', personality.description)
      .replace('{user_name}', user?.name || 'User')
      .replace('{active_goals}', goalsSummary)
      .replace('{memory_context}', memoryContext);

    // 6. Build Message Array (System prompt + last 10 messages from DB + new message)
    // We fetch current messages directly from the updated conversation (or slice last 10)
    const dbMessages = conversation.messages || [];
    const windowedMessages = [...dbMessages, userMessage].slice(-10);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...windowedMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      // 7. Get response from OpenAI
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: messages as any,
        temperature: 0.7,
      });

      const aiResponseContent = completion.choices[0]?.message?.content;
      if (!aiResponseContent) {
        throw new Error('AI returned an empty response');
      }

      // 8. Save AI response to DB
      const assistantMessage: AIMessage = { role: 'assistant', content: aiResponseContent };
      await AIConversationRepository.addMessage(conversation._id.toString(), assistantMessage);

      return aiResponseContent;
    } catch (error) {
      logger.error('Error in mentor chat completion', error);
      throw new ApiError(
        `AI Mentor failed to respond: ${(error as Error).message}`,
        500,
        'CHAT_COMPLETION_FAILED'
      );
    }
  }

  /**
   * Retrieves the chat history for a user
   */
  async getChatHistory(
    userId: string,
    contextType: 'MENTOR' | 'ROADMAP' | 'TASK' | 'JOURNAL' | 'PROGRESS' = 'MENTOR',
    goalId?: string
  ): Promise<AIMessage[]> {
    const conversation = await AIConversationRepository.findLatest(userId, contextType, goalId);
    return conversation?.messages || [];
  }

  /**
   * Clears the chat history for a user
   */
  async clearChatHistory(
    userId: string,
    contextType: 'MENTOR' | 'ROADMAP' | 'TASK' | 'JOURNAL' | 'PROGRESS' = 'MENTOR',
    goalId?: string
  ): Promise<void> {
    const conversation = await AIConversationRepository.findLatest(userId, contextType, goalId);
    if (conversation) {
      await AIConversationRepository.clearConversation(conversation._id.toString());
    }
  }

  /**
   * Retrieves the latest generated evaluation (suggestions + brutal motivation)
   */
  async getLatestEvaluation(userId: string): Promise<{ suggestions: string[]; brutal_motivation: string }> {
    logger.info(`Fetching latest AI Mentor evaluation for user ${userId}`);
    const conversation = await AIConversationRepository.findLatest(userId, 'MENTOR');
    
    // Check if we have an evaluation saved in the last assistant message
    const lastMsg = conversation?.messages?.filter(m => m.role === 'assistant').pop();
    if (lastMsg) {
      try {
        const parsed = JSON.parse(lastMsg.content);
        if (parsed.suggestions && parsed.brutal_motivation) {
          return parsed;
        }
      } catch (e) {
        logger.warn(`Failed to parse cached evaluation content: ${e}`);
      }
    }
    
    // If no valid cached evaluation, generate a new one!
    return this.generateEvaluation(userId);
  }

  /**
   * Generates a new evaluation (suggestions + brutal motivation) and caches it
   */
  async generateEvaluation(userId: string): Promise<{ suggestions: string[]; brutal_motivation: string }> {
    logger.info(`Generating new AI Mentor evaluation for user ${userId}`);

    try {
      // 1. Fetch user details and active goals
      const user = await UserRepository.findById(userId);
      const activeGoals = await GoalRepository.find({ user_id: userId, status: 'ACTIVE' });
      const goalsSummary = activeGoals.map((g) => `Goal: ${g.title} (Progress: ${g.progress_percentage}%)`).join('; ') || 'No active goals set.';

      // 2. Fetch memory context
      const memoryContext = await getContextForUser(userId);

      // 3. Construct System Prompt
      const systemPrompt = MENTOR_EVALUATION_PROMPT
        .replace('{user_name}', user?.name || 'User')
        .replace('{active_goals}', goalsSummary)
        .replace('{memory_context}', memoryContext);

      // 4. Get response from OpenAI
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.8,
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('AI returned an empty response');
      }

      // Try parsing JSON to ensure it is valid
      const parsed = JSON.parse(responseContent.trim());
      if (!parsed.suggestions || !parsed.brutal_motivation) {
        throw new Error('AI response did not match suggestions/brutal_motivation structure');
      }

      // 5. Cache this in the database under context 'MENTOR'
      let conversation = await AIConversationRepository.findLatest(userId, 'MENTOR');
      if (!conversation) {
        conversation = await AIConversationRepository.createConversation(userId, 'MENTOR');
      } else {
        // Clear previous messages to only keep the latest evaluation
        await AIConversationRepository.clearConversation(conversation._id.toString());
      }
      
      const assistantMessage: AIMessage = { role: 'assistant', content: JSON.stringify(parsed) };
      await AIConversationRepository.addMessage(conversation._id.toString(), assistantMessage);

      return parsed;
    } catch (error) {
      logger.error('Error generating AI mentor evaluation', error);
      // Fallback
      return {
        suggestions: [
          "Establish your goals clearly inside the Goals tab.",
          "Break down your milestones into daily study sessions.",
          "Complete today's study block before reflecting in your journal."
        ],
        brutal_motivation: "Zero excuses. Go to the dashboard, set your target, and start executing. Every second you spend slacking is a second someone else spends winning."
      };
    }
  }
}

export const MentorChatService = new MentorChatServiceClass();
export { getContextForUser as getChatContextForUser };
