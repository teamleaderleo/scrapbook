import { z } from 'zod';
import { accounts, blocks, projects, tags } from '../db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { JSONContent } from '@tiptap/react';

export type SelectAccount = InferSelectModel<typeof accounts>;
export type Account = InferInsertModel<typeof accounts>;

export type EntityType = 'project' | 'block';

export interface ProjectFetchOptions {
  includeTags: boolean;
  includeBlocks: boolean;
  blockDetail: 'none' | 'basic' | 'withContents' | 'extended';
}

export interface BlockFetchOptions {
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

export type BlockWithTags = Block & {
  tags: Tag[];
};

export type BlockWithProjects = Block & {
  projects: BaseProject[];
};

export type BlockWithRelations = BlockWithTags & BlockWithProjects;

export type BaseProject = InferSelectModel<typeof projects>;

export type ProjectPreview = BaseProject & {
  previewBlock?: {
    id?: string | null;
    name?: string | null;
    previewContent?: string | null;
  } | null;
};

export type ProjectWithTags = BaseProject & {
  tags: Tag[];
};

export type ProjectWithBlocks = ProjectWithTags & {
  blocks: Block[];
};

export type ProjectWithExtendedBlocks = ProjectWithTags & {
  blocks: BlockWithRelations[];
};

export type Block = {
  id: string;
  accountId: string;
  content: JSONContent;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
}


