import { z } from 'zod';
import { accounts, artifacts, projects, tags } from '../db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { JSONContent } from '@tiptap/react';

export type SelectAccount = InferSelectModel<typeof accounts>;
export type Account = InferInsertModel<typeof accounts>;

export type EntityType = 'project' | 'artifact';

export interface ProjectFetchOptions {
  includeTags: boolean;
  includeArtifacts: boolean;
  artifactDetail: 'none' | 'basic' | 'withContents' | 'extended';
}

export interface ArtifactFetchOptions {
  includeTags: boolean;
  includeContents: boolean;
  includeProjects: boolean;
}

export type Tag = InferSelectModel<typeof tags>;
// export type InsertTag = InferInsertModel<typeof tags>;

export type ContentType = 'text' | 'image' | 'file' | 'link';

export type S3Usage = {
  id: number;
  accountId: string;
  month: number;
  year: number;
  count: number;
};

export type ArtifactWithTags = Artifact & {
  tags: Tag[];
};

export type ArtifactWithProjects = Artifact & {
  projects: BaseProject[];
};

export type ArtifactWithRelations = ArtifactWithTags & ArtifactWithProjects;

export type BaseProject = InferSelectModel<typeof projects>;

export type ProjectPreview = BaseProject & {
  previewArtifact?: {
    id?: string | null;
    name?: string | null;
    previewContent?: string | null;
  } | null;
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

export type Artifact = {
  id: string;
  accountId: string;
  content: JSONContent;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
}


