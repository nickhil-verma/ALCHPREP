import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceTokenDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  platform: 'WEB' | 'ANDROID' | 'IOS';
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

const DeviceTokenSchema = new Schema<IDeviceTokenDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: {
      type: String,
      enum: ['WEB', 'ANDROID', 'IOS'],
      required: true,
    },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

DeviceTokenSchema.index({ user_id: 1, active: 1 });

export const DeviceToken =
  mongoose.models.DeviceToken ||
  mongoose.model<IDeviceTokenDocument>('DeviceToken', DeviceTokenSchema);
