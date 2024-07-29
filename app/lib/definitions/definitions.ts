import { z } from 'zod';
import { selectArtifactContentSchema, selectArtifactSchema, selectProjectSchema, selectTagSchema } from '../db/schema';
import { ContentVariantSchema } from '../db/zod-schemas';

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

export enum ContentType {
  Text = 'text',
  LongText = 'longText',
  Image = 'image',
  File = 'file',
  Link = 'link',
  Embed = 'embed'
}

export type ContentVariant = z.infer<typeof ContentVariantSchema>;

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

export const ProjectWithArtifactsViewRowSchema = z.object({
  ...selectProjectSchema.shape,
  tag: selectTagSchema.nullable(),
  artifact: selectArtifactSchema.nullable(),
  artifactContent: selectArtifactContentSchema.nullable(),
});

export type ProjectWithArtifactsViewRow = z.infer<typeof ProjectWithArtifactsViewRowSchema>;

export type ProjectWithExtendedArtifacts = ProjectWithTags & {
  artifacts: ArtifactWithRelations[];
};

