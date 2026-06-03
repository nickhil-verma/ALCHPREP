// ============================================
// GitHub Types
// ============================================

export interface GithubRepository {
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  last_push: Date;
}

export interface GithubCommit {
  sha: string;
  message: string;
  date: Date;
  repo: string;
}

export interface GithubActivitySnapshot {
  date: Date;
  commits_count: number;
  repos_active: number;
  languages_used: string[];
  summary?: string;
}

export interface IGithubStats {
  _id: string;
  user_id: string;
  username: string;
  repositories: GithubRepository[];
  recent_commits: GithubCommit[];
  activity_snapshots: GithubActivitySnapshot[];
  last_synced: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ConnectGithubRequest {
  username: string;
}
