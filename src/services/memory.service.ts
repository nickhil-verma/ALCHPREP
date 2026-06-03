import { MemoryRepository } from '@/repositories/memory.repository';
import { NotFoundError, ForbiddenError } from '@/lib/utils/api-error';
import type { IMemoryDocument } from '@/models/memory.model';
import type { MemoryType } from '@/types/memory.types';

class MemoryServiceClass {
  /**
   * Adds a new memory item
   */
  async addMemory(
    userId: string,
    content: string,
    type: MemoryType,
    importanceScore: number,
    category?: string,
    source = 'manual'
  ): Promise<IMemoryDocument> {
    return MemoryRepository.create({
      user_id: userId,
      type,
      content,
      importance_score: importanceScore,
      category: category || undefined,
      source,
    } as any);
  }

  /**
   * Retrieves memories for a user, optionally filtered by type
   */
  async getMemories(userId: string, type?: MemoryType): Promise<IMemoryDocument[]> {
    const filter: any = { user_id: userId };
    if (type) {
      filter.type = type;
    }
    return MemoryRepository.find(filter, { sort: { importance_score: -1, created_at: -1 } });
  }

  /**
   * Deletes a specific memory item after verifying ownership
   */
  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    const memory = await MemoryRepository.findById(memoryId);
    if (!memory) {
      throw new NotFoundError('Memory item');
    }
    if (memory.user_id.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this memory item');
    }
    await MemoryRepository.delete(memoryId);
  }

  /**
   * Cleans up short-term memories older than 7 days
   */
  async cleanupStaleMemories(userId: string): Promise<number> {
    return MemoryRepository.cleanupShortTerm(userId, 7);
  }
}

export const MemoryService = new MemoryServiceClass();
