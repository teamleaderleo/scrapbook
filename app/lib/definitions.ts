export type Account = {
  id: string;
  name: string;
  email: string;
  password: string; 
};

export type Tag = {
  account_id: string;
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
  account_id: string;
  id: string;
  name: string;
  type: ArtifactType;
  contents: ArtifactContent[];
  description?: string;
  created_at: string;
  updated_at: string;
};

export type ArtifactDetail = Artifact & {
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
  account_id: string;
  project_id: string; 
  artifact_id: string; 
  added_at: string;
};

export type Project = {
  account_id: string;
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'completed';
};

export type ProjectDetail = Project & {
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
export type ProjectView = ProjectDetail & {
  total_projects: number;
  total_pending: number;
  total_completed: number;
  total_tags: number;
  total_associated_artifacts: number;
};

export type ArtifactView = ArtifactDetail &{
  total_artifacts: number;
  total_tags: number;
  total_associated_projects: number;
};

// Dashboard view
export type DashboardView = {
  account_id: string;
  total_accounts: number;
  total_projects: number;
  total_artifacts: number;
  total_tags: number;
  completed_projects: number;
  pending_projects: number;
};