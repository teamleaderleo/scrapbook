import { Tag } from "./definitions";
import { Artifact, ArtifactWithRelations } from "./artifact-definitions";

export type BaseProject = {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'completed';
};export type ProjectBasic = Pick<BaseProject, 'id' | 'name' | 'status'>;

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
// Type for the query result

export type ProjectView = ProjectWithArtifacts & {
  totalProjects: number;
  totalPending: number;
  totalCompleted: number;
  totalTags: number;
  totalAssociatedArtifacts: number;
};

