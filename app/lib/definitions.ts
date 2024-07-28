export type Account = {
  id: string; // Primary key
  name: string;
  email: string; // Unique
  password?: string;
  provider?: string;
  providerAccountId?: string;
  lastLogin?: Date;
};

export interface FetchOptions { // idk why we'd want interfaces over types
  includeTags?: boolean;
  includeContents?: boolean;
  includeProjects?: boolean;
  includeArtifacts?: 'none' | 'withContents' | 'extended';
}

export interface ProjectFetchOptions {
  includeTags: boolean;
  includeArtifacts: 'none' | 'basic' | 'withContents' | 'extended';
}

export interface ArtifactFetchOptions {
  includeTags: boolean;
  includeContents: boolean;
  includeProjects: boolean;
}

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

export type ProjectArtifactLink = {
  accountId: string;
  projectId: string; 
  artifactId: string; 
  addedAt: Date;
};

export type ArtifactTag = {
  accountId: string; 
  artifactId: string; 
  tagId: string; 
};

export type ContentType = 'text' | 'longText' | 'image' | 'file' | 'link' | 'embed';

export type ContentVariant = {
  url: string;
  type: string;
};

export type EmbedData = {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  authorName?: string;
  authorUrl?: string;
  providerName?: string;
  providerUrl?: string;
};

export type Annotation = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ImageVersions = {
  original: string;
  compressed: string;
  thumbnails: { [key: string]: string };
};

export type ArtifactContent = {
  id: string;
  accountId: string;
  artifactId: string;
  type: ContentType;
  content: string;
  variants?: ContentVariant[];
  metadata?: {
    originalName?: string;
    size?: number;
    mimeType?: string;
    originalUrl?: string;
    [key: string]: unknown;
  };
  embed?: EmbedData;
  annotations?: Annotation[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
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

export type ArtifactWithTags = Artifact & {
  tags: Tag[];
};

export type ArtifactWithProjects = Artifact & {
  projects: BaseProject[];
};

export type ArtifactWithRelations = ArtifactWithTags & ArtifactWithProjects;

export type ArtifactView = ArtifactWithRelations & {
  totalArtifacts: number;
  totalTags: number;
  totalAssociatedProjects: number;
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

export type ProjectWithTags = BaseProject & {
  tags: Tag[];
};

export type ProjectWithArtifacts = ProjectWithTags & {
  artifacts: Artifact[];
};

export type ProjectWithExtendedArtifacts = ProjectWithTags & {
  artifacts: ArtifactWithRelations[];
};

// Type for the query result
export type ProjectView = ProjectWithArtifacts & {
  totalProjects: number;
  totalPending: number;
  totalCompleted: number;
  totalTags: number;
  totalAssociatedArtifacts: number;
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