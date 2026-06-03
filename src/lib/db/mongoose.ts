// ============================================
// MongoDB Connection Singleton
// ============================================
// Optimized for serverless: caches the connection promise on globalThis
// so that hot-reloading in dev and concurrent lambda invocations in prod
// don't create multiple connections.

import mongoose from 'mongoose';
import { logger } from '@/lib/utils/logger';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend globalThis to cache connection across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    logger.info('Connecting to MongoDB...', 'DB');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
      logger.info('MongoDB connected successfully', 'DB');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    logger.error('MongoDB connection failed', error, 'DB');
    throw error;
  }

  return cached.conn;
}
