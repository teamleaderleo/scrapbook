import { ContentType, ContentVariant, EmbedData, Annotation, Tag } from "../definitions";
import { BaseProject } from "./project-definitions";


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

export type ArtifactBasic = Pick<BaseArtifact, 'id' | 'name'>;

export type ArtifactPreview = BaseArtifact & {
  previewContent?: string;
};

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

export type ArtifactView = ArtifactWithRelations & {
  totalArtifacts: number;
  totalTags: number;
  totalAssociatedProjects: number;
};
