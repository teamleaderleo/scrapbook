import { Artifact, ArtifactWithRelations } from "./artifact-definitions";
import { z } from 'zod';
import { selectArtifactContentSchema, selectArtifactSchema, selectProjectSchema, selectTagSchema } from "../db/schema";
import { Tag } from "./definitions";

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