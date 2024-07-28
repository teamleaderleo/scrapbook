export type Account = {
  id: string; // Primary key
  name: string;
  email: string; // Unique
  password?: string;
  provider?: string;
  providerAccountId?: string;
  lastLogin?: Date;
};

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