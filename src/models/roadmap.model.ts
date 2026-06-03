import mongoose, { Schema, Document } from 'mongoose';
import type { MilestoneStatus } from '@/types/roadmap.types';

export interface IMilestoneSubdoc {
  title: string;
  description: string;
  expected_completion_date: Date;
  status: MilestoneStatus;
  order: number;
}

export interface IRoadmapDocument extends Document {
  goal_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  milestones: IMilestoneSubdoc[];
  generated_at: Date;
  updated_at: Date;
}

const MilestoneSchema = new Schema<IMilestoneSubdoc>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    expected_completion_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
      default: 'PENDING',
    },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const RoadmapSchema = new Schema<IRoadmapDocument>(
  {
    goal_id: { type: Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    milestones: [MilestoneSchema],
    generated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updated_at' },
  }
);

// One roadmap per goal
RoadmapSchema.index({ goal_id: 1 }, { unique: true });

export const Roadmap =
  mongoose.models.Roadmap || mongoose.model<IRoadmapDocument>('Roadmap', RoadmapSchema);
