import mongoose, { Schema, Document } from 'mongoose';
import type { AIMessage } from '@/types/ai.types';

export interface IAIConversationDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  messages: AIMessage[];
  context_type: 'MENTOR' | 'ROADMAP' | 'TASK' | 'JOURNAL' | 'PROGRESS';
  goal_id?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const AIMessageSchema = new Schema<AIMessage>(
  {
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const AIConversationSchema = new Schema<IAIConversationDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [AIMessageSchema],
    context_type: {
      type: String,
      enum: ['MENTOR', 'ROADMAP', 'TASK', 'JOURNAL', 'PROGRESS'],
      required: true,
    },
    goal_id: { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

AIConversationSchema.index({ user_id: 1, created_at: -1 });

export const AIConversation =
  mongoose.models.AIConversation ||
  mongoose.model<IAIConversationDocument>('AIConversation', AIConversationSchema);
