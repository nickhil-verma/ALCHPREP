import mongoose, { Schema, Document } from 'mongoose';

interface IGithubRepository {
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  last_push: Date;
}

interface IGithubCommit {
  sha: string;
  message: string;
  date: Date;
  repo: string;
}

interface IGithubActivitySnapshot {
  date: Date;
  commits_count: number;
  repos_active: number;
  languages_used: string[];
  summary?: string;
}

export interface IGithubStatsDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  username: string;
  repositories: IGithubRepository[];
  recent_commits: IGithubCommit[];
  activity_snapshots: IGithubActivitySnapshot[];
  last_synced: Date;
  created_at: Date;
  updated_at: Date;
}

const GithubStatsSchema = new Schema<IGithubStatsDocument>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    username: { type: String, required: true },
    repositories: [
      {
        name: String,
        full_name: String,
        language: String,
        stars: Number,
        last_push: Date,
      },
    ],
    recent_commits: [
      {
        sha: String,
        message: String,
        date: Date,
        repo: String,
      },
    ],
    activity_snapshots: [
      {
        date: Date,
        commits_count: Number,
        repos_active: Number,
        languages_used: [String],
        summary: String,
      },
    ],
    last_synced: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const GithubStats =
  mongoose.models.GithubStats ||
  mongoose.model<IGithubStatsDocument>('GithubStats', GithubStatsSchema);
