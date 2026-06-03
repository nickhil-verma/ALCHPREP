import { BaseRepository } from './base.repository';
import { Memory, IMemoryDocument } from '@/models/memory.model';
import type { MemoryType } from '@/types/memory.types';

class MemoryRepositoryClass extends BaseRepository<IMemoryDocument> {
  constructor() {
    super(Memory);
  }

  async findByType(userId: string, type: MemoryType): Promise<IMemoryDocument[]> {
    return this.find(
      { user_id: userId, type },
      { sort: { importance_score: -1, updated_at: -1 } }
    );
  }

  async findImportant(userId: string, minScore: number = 7): Promise<IMemoryDocument[]> {
    return this.find(
      { user_id: userId, importance_score: { $gte: minScore } },
      { sort: { importance_score: -1 }, limit: 20 }
    );
  }

  async findLongTerm(userId: string): Promise<IMemoryDocument[]> {
    return this.findByType(userId, 'LONG');
  }

  async upsertLongTerm(
    userId: string,
    category: string,
    content: string,
    score: number
  ): Promise<IMemoryDocument> {
    await this.ensureConnection();
    return this.model.findOneAndUpdate(
      { user_id: userId, type: 'LONG', category },
      {
        $set: {
          content,
          importance_score: score,
          source: 'system',
          updated_at: new Date(),
        },
        $setOnInsert: {
          user_id: userId,
          type: 'LONG',
          category,
          created_at: new Date(),
        },
      },
      { new: true, upsert: true }
    ).lean<IMemoryDocument>() as Promise<IMemoryDocument>;
  }

  async cleanupShortTerm(userId: string, olderThanDays: number = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    return this.deleteMany({
      user_id: userId,
      type: 'SHORT',
      created_at: { $lt: cutoff },
    } as never);
  }
}

export const MemoryRepository = new MemoryRepositoryClass();
