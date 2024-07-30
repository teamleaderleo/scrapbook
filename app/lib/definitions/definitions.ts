import { z } from 'zod';
import { accounts, artifacts, projects, tags } from '../db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

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

export type BaseArtifact = InferSelectModel<typeof artifacts>;

export type Artifact = BaseArtifact & {
  contents: ArtifactContent[];
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

// Metadata schemas
const BaseMetadataSchema = z.object({
  order: z.number().int().nonnegative(),
});

const ImageMetadataSchema = BaseMetadataSchema.extend({
  variations: z.record(z.string()),
  dominantColors: z.array(z.string()).optional(),
});

const FileMetadataSchema = BaseMetadataSchema.extend({
  originalName: z.string(),
  size: z.number(),
  mimeType: z.string(),
});

const LinkMetadataSchema = BaseMetadataSchema.extend({
  title: z.string().optional(),
  description: z.string().optional(),
  previewImage: z.string().optional(),
});

// Content type union
const ContentTypeUnion = z.union([
  z.object({ type: z.literal('text'), metadata: BaseMetadataSchema }),
  z.object({ type: z.literal('image'), metadata: ImageMetadataSchema }),
  z.object({ type: z.literal('file'), metadata: FileMetadataSchema }),
  z.object({ type: z.literal('link'), metadata: LinkMetadataSchema }),
]);

// Full artifact content schema
export const ArtifactContentSchema = z.intersection(
  z.object({
    id: z.string().uuid(),
    accountId: z.string().uuid(),
    artifactId: z.string().uuid(),
    content: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().uuid().nullable(),
    lastModifiedBy: z.string().uuid().nullable(),
  }),
  ContentTypeUnion
);

// Type definitions
export type ArtifactContent = z.infer<typeof ArtifactContentSchema>;
export type ArtifactFormSubmission = z.infer<typeof ArtifactFormSubmissionSchema>;export const ArtifactFormSubmissionSchema = z.object({
  name: z.string().min(1, 'Artifact name is required.'),
  description: z.string().optional(),
  tags: z.array(z.string()),
  projects: z.array(z.string()),
  contents: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(['text', 'image', 'file', 'link']),
    content: z.union([z.string(), z.instanceof(Blob)]),
    metadata: z.record(z.unknown()),
  })),
});

