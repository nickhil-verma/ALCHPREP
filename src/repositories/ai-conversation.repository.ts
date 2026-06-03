import { BaseRepository } from './base.repository';
import { AIConversation, IAIConversationDocument } from '@/models/ai-conversation.model';
import type { AIMessage } from '@/types/ai.types';

class AIConversationRepositoryClass extends BaseRepository<IAIConversationDocument> {
  constructor() {
    super(AIConversation);
  }

  async findLatest(
    userId: string,
    contextType: 'MENTOR' | 'ROADMAP' | 'TASK' | 'JOURNAL' | 'PROGRESS',
    goalId?: string
  ): Promise<IAIConversationDocument | null> {
    await this.ensureConnection();
    const query: any = { user_id: userId, context_type: contextType };
    if (goalId) {
      query.goal_id = goalId;
    } else {
      query.goal_id = null;
    }
    return this.model.findOne(query).sort({ updated_at: -1 });
  }

  async addMessage(
    conversationId: string,
    message: AIMessage
  ): Promise<IAIConversationDocument | null> {
    await this.ensureConnection();
    return this.model.findByIdAndUpdate(
      conversationId,
      {
        $push: { messages: message },
      },
      { new: true }
    );
  }

  async createConversation(
    userId: string,
    contextType: 'MENTOR' | 'ROADMAP' | 'TASK' | 'JOURNAL' | 'PROGRESS',
    goalId?: string,
    initialMessages: AIMessage[] = []
  ): Promise<IAIConversationDocument> {
    await this.ensureConnection();
    const createData: any = {
      user_id: userId,
      context_type: contextType,
      messages: initialMessages,
    };
    if (goalId) {
      createData.goal_id = goalId;
    }
    return this.model.create(createData);
  }

  async clearConversation(conversationId: string): Promise<IAIConversationDocument | null> {
    await this.ensureConnection();
    return this.model.findByIdAndUpdate(
      conversationId,
      {
        $set: { messages: [] },
      },
      { new: true }
    );
  }
}

export const AIConversationRepository = new AIConversationRepositoryClass();
