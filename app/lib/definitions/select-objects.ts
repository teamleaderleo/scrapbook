import { projects, tags, artifacts, artifactContents, artifactTags } from "../db/schema";

export const baseProjectSelect = {
  id: projects.id,
  accountId: projects.accountId,
  name: projects.name,
  description: projects.description,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
  status: projects.status,
};

export const tagSelect = {
  id: tags.id,
  accountId: tags.accountId,
  name: tags.name,
};

export const artifactSelect = {
  id: artifacts.id,
  accountId: artifacts.accountId,
  name: artifacts.name,
  description: artifacts.description,
  createdAt: artifacts.createdAt,
  updatedAt: artifacts.updatedAt,
};

export const artifactContentSelect = {
  id: artifactContents.id,
  accountId: artifactContents.accountId,
  artifactId: artifactContents.artifactId,
  type: artifactContents.type,
  content: artifactContents.content,
  metadata: artifactContents.metadata,
  createdAt: artifactContents.createdAt,
  updatedAt: artifactContents.updatedAt,
  createdBy: artifactContents.createdBy,
  lastModifiedBy: artifactContents.lastModifiedBy,
};

export const artifactTagSelect = {
  accountId: artifactTags.accountId,
  artifactId: artifactTags.artifactId,
  tagId: artifactTags.tagId,
};