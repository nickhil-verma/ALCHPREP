// ============================================
// AI Types
// ============================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface IAIConversation {
  _id: string;
  user_id: string;
  messages: AIMessage[];
  context_type: 'MENTOR' | 'ROADMAP' | 'TASK' | 'JOURNAL' | 'PROGRESS';
  goal_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MentorChatRequest {
  message: string;
  goal_id?: string;
  conversation_id?: string;
}

export interface MentorChatResponse {
  reply: string;
  conversation_id: string;
}

export interface AIContext {
  goals?: string;
  tasks?: string;
  journals?: string;
  progress?: string;
  memories?: string;
  github?: string;
}
