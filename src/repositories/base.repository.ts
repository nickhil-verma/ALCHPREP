// ============================================
// Base Repository — Generic CRUD Operations
// ============================================
// All domain repositories extend this. Route handlers never
// touch Mongoose directly — they go through repositories.

import mongoose, { Model, Document } from 'mongoose';
import { connectDB } from '@/lib/db/mongoose';
import type { PaginationQuery, PaginationMeta } from '@/types/api.types';

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  protected async ensureConnection(): Promise<void> {
    await connectDB();
  }

  async create(data: Partial<T>): Promise<T> {
    await this.ensureConnection();
    const doc = new this.model(data);
    return doc.save();
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    await this.ensureConnection();
    return this.model.insertMany(data) as unknown as T[];
  }

  async findById(id: string): Promise<T | null> {
    await this.ensureConnection();
    return this.model.findById(id).lean<T>();
  }

  async findOne(filter: any): Promise<T | null> {
    await this.ensureConnection();
    return this.model.findOne(filter).lean<T>();
  }

  async find(
    filter: any,
    options?: any
  ): Promise<T[]> {
    await this.ensureConnection();
    const query = this.model.find(filter);
    if (options?.sort) query.sort(options.sort);
    if (options?.limit) query.limit(options.limit);
    if (options?.skip) query.skip(options.skip);
    return query.lean<T[]>();
  }

  async findPaginated(
    filter: any,
    pagination: PaginationQuery
  ): Promise<{ data: T[]; meta: PaginationMeta }> {
    await this.ensureConnection();
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const skip = (page - 1) * limit;
    const sortField = pagination.sort || 'created_at';
    const sortOrder = pagination.order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean<T[]>(),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: any): Promise<T | null> {
    await this.ensureConnection();
    return this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .lean<T>();
  }

  async updateMany(
    filter: any,
    data: any
  ): Promise<number> {
    await this.ensureConnection();
    const result = await this.model.updateMany(filter, data);
    return result.modifiedCount;
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureConnection();
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  async deleteMany(filter: any): Promise<number> {
    await this.ensureConnection();
    const result = await this.model.deleteMany(filter);
    return result.deletedCount;
  }

  async count(filter: any): Promise<number> {
    await this.ensureConnection();
    return this.model.countDocuments(filter);
  }

  async aggregate<R = unknown>(pipeline: any[]): Promise<R[]> {
    await this.ensureConnection();
    return this.model.aggregate(pipeline);
  }
}
