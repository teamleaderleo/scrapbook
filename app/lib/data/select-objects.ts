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
  name: tags.name,
};

export const artifactSelect = {
  id: artifacts.id,
  name: artifacts.name,
  description: artifacts.description,
  createdAt: artifacts.createdAt,
  updatedAt: artifacts.updatedAt,
};

export const artifactContentSelect = {
  id: artifactContents.id,
  type: artifactContents.type,
  content: artifactContents.content,
};

export const artifactTagSelect = {
  id: artifactTags.artifactId,
  name: tags.name,
};