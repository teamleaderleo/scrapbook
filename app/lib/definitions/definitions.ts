import { accounts, blocks, projects, tags } from '../db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { JSONContent } from '@tiptap/react';
import { z } from 'zod';

export type SelectAccount = InferSelectModel<typeof accounts>;
export type Account = InferInsertModel<typeof accounts>;

export type EntityType = 'project' | 'block';

export interface ProjectFetchOptions {
  includeTags: boolean;
  includeBlocks: boolean;
}

export interface BlockFetchOptions {
  includeTags: boolean;
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

export type Block = InferSelectModel<typeof blocks>;
// export type InsertBlock = InferInsertModel<typeof blocks>;

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

export type ProjectWithBlocksWithTags = ProjectWithTags & {
  blocks: BlockWithTags[];
};

export type ProjectWithExtendedBlocks = ProjectWithTags & {
  blocks: BlockWithRelations[];
};

export const ProjectFormSubmissionSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "completed"]),
  // blocks: z.array(z.string()),
  // tags: z.array(z.string()),
});

export type ProjectFormSubmission = z.infer<typeof ProjectFormSubmissionSchema>;
