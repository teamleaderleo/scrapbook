import { z } from "zod";
import { BaseProject } from "./project-definitions";
import {  selectArtifactContentSchema, selectArtifactSchema,  } from "../db/schema";
import { Tag } from "./definitions";

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
