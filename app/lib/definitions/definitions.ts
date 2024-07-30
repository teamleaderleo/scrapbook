import { z } from 'zod';
import { selectArtifactContentSchema, selectArtifactSchema, selectProjectSchema, selectTagSchema } from '../db/schema';

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
  includeArtifacts: boolean;
  artifactDetail: 'none' | 'basic' | 'withContents' | 'extended';
}

export interface ArtifactFetchOptions {
  includeTags: boolean;
  includeContents: boolean;
  includeProjects: boolean;
}

export type Tag = z.infer<typeof selectTagSchema>;

export const ContentTypeSchema = z.enum(['text', 'image', 'file', 'link',]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export type S3Usage = {
  id: number;
  accountId: string;
  month: number;
  year: number;
  count: number;
};
export type ArtifactContent = z.infer<typeof selectArtifactContentSchema>;
export type BaseArtifact = z.infer<typeof selectArtifactSchema>;

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

export type BaseProject = z.infer<typeof selectProjectSchema>;

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

export const ProjectWithArtifactsViewSchema = z.object({
  ...selectProjectSchema.shape,
  tags: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
    })
  ).default([]),
  artifacts: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().nullable(),
      created_at: z.string().transform((str) => new Date(str)),
      updated_at: z.string().transform((str) => new Date(str)),
      contents: z.array(
        z.object({
          id: z.string().uuid(),
          type: z.string(),
          content: z.string(),
          metadata: z.record(z.unknown()).nullable(),
          created_at: z.string().transform((str) => new Date(str)),
          updated_at: z.string().transform((str) => new Date(str)),
          created_by: z.string().uuid().nullable(),
          last_modified_by: z.string().uuid().nullable(),
        })
      ).default([]),
    })
  ).default([]),
});

export type ProjectWithArtifactsView = z.infer<typeof ProjectWithArtifactsViewSchema>;

export type ProjectWithExtendedArtifacts = ProjectWithTags & {
  artifacts: ArtifactWithRelations[];
};

const BaseMetadataSchema = z.object({
  order: z.number().int().nonnegative(),
});


const ImageMetadataSchema = BaseMetadataSchema.extend({
  variations: z.record(z.string()).optional(),
});

const LinkMetadataSchema = BaseMetadataSchema.extend({
  title: z.string().optional(),
  description: z.string().optional(),
  previewImage: z.string().optional(),
});

// Combined metadata schema
export const ContentMetadataSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), ...BaseMetadataSchema.shape }),
  z.object({ type: z.literal('image'), ...ImageMetadataSchema.shape }),
  z.object({ type: z.literal('file'), ...BaseMetadataSchema.shape }),
  z.object({ type: z.literal('link'), ...LinkMetadataSchema.shape }),
]);
