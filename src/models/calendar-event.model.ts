import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarEventDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'TASK' | 'MILESTONE' | 'DEADLINE' | 'CUSTOM';
  linked_task_id?: mongoose.Types.ObjectId;
  linked_goal_id?: mongoose.Types.ObjectId;
  created_at: Date;
}

const CalendarEventSchema = new Schema<ICalendarEventDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    type: {
      type: String,
      enum: ['TASK', 'MILESTONE', 'DEADLINE', 'CUSTOM'],
      default: 'CUSTOM',
    },
    linked_task_id: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    linked_goal_id: { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

CalendarEventSchema.index({ user_id: 1, start: 1 });

export const CalendarEvent =
  mongoose.models.CalendarEvent ||
  mongoose.model<ICalendarEventDocument>('CalendarEvent', CalendarEventSchema);
