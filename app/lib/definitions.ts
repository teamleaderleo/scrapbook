export type Account = {
  id: string; // Primary key
  name: string;
  email: string; // Unique
  password?: string;
  provider?: string;
  providerAccountId?: string;
  lastLogin?: Date;
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
  createdAt: Date;
};

export type BaseArtifact = {
  accountId: string;
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Artifact = BaseArtifact &{
  contents: ArtifactContent[];
};

export type ArtifactWithRelations = Artifact & {
  tags: Tag[];
  projects: BaseProject[];
};

export type ProjectArtifactLink = {
  accountId: string;
  projectId: string; 
  artifactId: string; 
  addedAt: Date;
};

export type BaseProject = {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'completed';
};

export type ProjectWithRelations = BaseProject & {
  tags: Tag[];
  artifacts: Artifact[];
};

// Type for the query result
export type ProjectView = ProjectWithRelations & {
  totalProjects: number;
  totalPending: number;
  totalCompleted: number;
  totalTags: number;
  totalAssociatedArtifacts: number;
};

export type ArtifactView = ArtifactWithRelations & {
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