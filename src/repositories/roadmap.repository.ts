import { BaseRepository } from './base.repository';
import { Roadmap, IRoadmapDocument } from '@/models/roadmap.model';

class RoadmapRepositoryClass extends BaseRepository<IRoadmapDocument> {
  constructor() {
    super(Roadmap);
  }

  async findByGoal(goalId: string): Promise<IRoadmapDocument | null> {
    return this.findOne({ goal_id: goalId });
  }

  async upsertByGoal(goalId: string, data: Partial<IRoadmapDocument>): Promise<IRoadmapDocument> {
    await this.ensureConnection();
    return this.model.findOneAndUpdate(
      { goal_id: goalId },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    ).lean<IRoadmapDocument>() as Promise<IRoadmapDocument>;
  }

  async updateMilestoneStatus(
    goalId: string,
    milestoneIndex: number,
    status: string
  ): Promise<IRoadmapDocument | null> {
    await this.ensureConnection();
    return this.model
      .findOneAndUpdate(
        { goal_id: goalId },
        { $set: { [`milestones.${milestoneIndex}.status`]: status } },
        { new: true }
      )
      .lean<IRoadmapDocument>();
  }
  async deleteByGoalId(goalId: string): Promise<any> {
    await this.ensureConnection();
    return this.model.deleteOne({ goal_id: goalId });
  }
}

export const RoadmapRepository = new RoadmapRepositoryClass();
