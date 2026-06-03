// ============================================
// Memory Types
// ============================================

export type MemoryType = 'SHORT' | 'MEDIUM' | 'LONG';

export interface IMemory {
  _id: string;
  user_id: string;
  type: MemoryType;
  content: string;
  importance_score: number; // 0-10
  category?: string;
  source?: string; // e.g. 'journal', 'task_pattern', 'progress'
  created_at: Date;
  updated_at: Date;
}

export interface CreateMemoryRequest {
  type: MemoryType;
  content: string;
  importance_score: number;
  category?: string;
  source?: string;
}
