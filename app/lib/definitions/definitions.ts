import { z } from 'zod';
import { selectArtifactContentSchema, selectTagSchema } from '../db/schema';
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
export type ArtifactContent = z.infer<typeof selectArtifactContentSchema>;

export type S3Usage = {
  id: number;
  accountId: string;
  month: number;
  year: number;
  count: number;
};