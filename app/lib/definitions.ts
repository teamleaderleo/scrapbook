export type User = {
  id: string;
  name: string;
  email: string;
  password: string; 
};

export type Tag = {
  user_id: string;
  id: string;
  name: string;
  artifact_id?: string;
  project_id?: string;
};

export type ArtifactType = 'text' | 'image' | 'file';

export type ArtifactContent = {
  id: string;
  type: ArtifactType;
  content: string;
  created_at: string;
};

export type Artifact = {
  user_id: string;
  id: string;
  name: string;
  type: ArtifactType;
  contents: ArtifactContent[];
  description?: string;
  created_at: string;
  updated_at: string;
};

export type LatestArtifact = Artifact & {
  tags: {
    id: string;
    name: string;
  }[];
  projects: {
    id: string;
    name: string;
    status: 'pending' | 'completed';
  }[];
};

export type ProjectArtifactLink = {
  user_id: string;
  project_id: string; 
  artifact_id: string; 
  added_at: string;
};

export type Project = {
  user_id: string;
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'completed';
};

export type LatestProject = Project & {
  tags: {
    id: string;
    name: string;
  }[];
  artifacts: {
    id: string;
    name: string;
    type: ArtifactType;
    content: string;
  }[];
};

// Type for the query result
export type ProjectView = LatestProject & {
  total_projects: number;
  total_pending: number;
  total_completed: number;
  total_tags: number;
  total_associated_artifacts: number;
};

export type ArtifactView = LatestArtifact &{
  total_artifacts: number;
  total_tags: number;
  total_associated_projects: number;
};

// Dashboard view
export type DashboardView = {
  user_id: string;
  total_users: number;
  total_projects: number;
  total_artifacts: number;
  total_tags: number;
  completed_projects: number;
  pending_projects: number;
};