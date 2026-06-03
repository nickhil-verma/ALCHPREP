// ============================================
// Journal Types
// ============================================

export type Mood = 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE';

export interface IJournal {
  _id: string;
  user_id: string;
  content: string;
  mood: Mood;
  tags?: string[];
  ai_analysis?: string;
  created_at: Date;
}

export interface CreateJournalRequest {
  content: string;
  mood: Mood;
  tags?: string[];
}
