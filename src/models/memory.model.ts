import mongoose, { Schema, Document } from 'mongoose';
import type { MemoryType } from '@/types/memory.types';

export interface IMemoryDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  type: MemoryType;
  content: string;
  importance_score: number;
  category?: string;
  source?: string;
  created_at: Date;
  updated_at: Date;
}

const MemorySchema = new Schema<IMemoryDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['SHORT', 'MEDIUM', 'LONG'],
      required: true,
    },
    content: { type: String, required: true, maxlength: 5000 },
    importance_score: { type: Number, required: true, min: 0, max: 10 },
    category: { type: String, default: null },
    source: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

MemorySchema.index({ user_id: 1, type: 1 });
MemorySchema.index({ user_id: 1, importance_score: -1 });

export const Memory =
  mongoose.models.Memory || mongoose.model<IMemoryDocument>('Memory', MemorySchema);
