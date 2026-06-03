import mongoose, { Schema, Document } from 'mongoose';
import type { Mood } from '@/types/journal.types';

export interface IJournalDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  content: string;
  mood: Mood;
  tags: string[];
  ai_analysis?: string;
  created_at: Date;
}

const JournalSchema = new Schema<IJournalDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 5000 },
    mood: {
      type: String,
      enum: ['GREAT', 'GOOD', 'OKAY', 'BAD', 'TERRIBLE'],
      required: true,
    },
    tags: [{ type: String, trim: true }],
    ai_analysis: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

JournalSchema.index({ user_id: 1, created_at: -1 });

export const Journal =
  mongoose.models.Journal || mongoose.model<IJournalDocument>('Journal', JournalSchema);
