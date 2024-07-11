export type Account = {
  id: string; // Primary key
  name: string;
  email: string; // Unique
  password?: string;
  provider?: string;
  providerAccountId?: string;
  lastLogin?: string;
};

export type Tag = {
  id: string; 
  accountId: string; 
  name: string; // Unique per account
};

export type ProjectTag = {
  accountId: string; 
  projectId: string; 
  tagId: string; 
};

export type ArtifactTag = {
  accountId: string; 
  artifactId: string; 
  tagId: string; 
};

export type ContentType = 'text' | 'image' | 'file';

export type ArtifactContent = {
  id: string;
  accountId: string;
  type: ContentType;
  content: string;
  createdAt: string;
};

export type Artifact = {
  accountId: string;
  id: string;
  name: string;
  contents: ArtifactContent[];
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type ArtifactDetail = Artifact & {
  tags: Tag[];
  projects: Project[];
};

export type ProjectArtifactLink = {
  accountId: string;
  projectId: string; 
  artifactId: string; 
  addedAt: string;
};

export type Project = {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'completed';
};

export type ProjectDetail = Project & {
  tags: Tag[];
  artifacts: Artifact[];
};

// Type for the query result
export type ProjectView = ProjectDetail & {
  totalProjects: number;
  totalPending: number;
  totalCompleted: number;
  totalTags: number;
  totalAssociatedArtifacts: number;
};

export type ArtifactView = ArtifactDetail & {
  totalArtifacts: number;
  totalTags: number;
  totalAssociatedProjects: number;
};

// Dashboard view
export type DashboardView = {
  accountId: string;
  totalAccounts: number;
  totalProjects: number;
  totalArtifacts: number;
  totalTags: number;
  completedProjects: number;
  pendingProjects: number;
};

export type S3Usage = {
  id: number;
  accountId: string;
  month: number;
  year: number;
  count: number;
};