import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  refresh_token: string;
  expires_at: Date;
  device_info?: string;
  ip_address?: string;
  created_at: Date;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refresh_token: { type: String, required: true, index: true },
    expires_at: { type: Date, required: true },
    device_info: { type: String, default: null },
    ip_address: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Auto-delete expired sessions
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const Session =
  mongoose.models.Session || mongoose.model<ISessionDocument>('Session', SessionSchema);
