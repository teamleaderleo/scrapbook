'use server';

import { eq, and, or, ilike, sql, SQL, desc } from 'drizzle-orm';
import { db } from '../db/db.server';
import { artifacts, artifactContents, artifactTags, tags, projectArtifactLinks, projects } from '../db/schema';
import { ArtifactFetchOptions } from '../definitions/definitions';
import { ArtifactWithRelations } from "../definitions/artifact-definitions";

function buildArtifactSelectObject(options: ArtifactFetchOptions = {
  includeTags: false,
  includeContents: false,
  includeProjects: false
}): Record<string, any> {
  const selectObject: Record<string, any> = {
    id: artifacts.id,
    accountId: artifacts.accountId,
    name: artifacts.name,
    description: artifacts.description,
    createdAt: artifacts.createdAt,
    updatedAt: artifacts.updatedAt,
  };

  if (options.includeTags) {
    selectObject.tags = sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${tags.id},
          'accountId', ${tags.accountId},
          'name', ${tags.name}
        )) FILTER (WHERE ${tags.id} IS NOT NULL),
        '[]'
      )
    `.as('tags');
  }

  if (options.includeContents) {
    selectObject.contents = sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${artifactContents.id},
          'accountId', ${artifactContents.accountId},
          'type', ${artifactContents.type},
          'content', ${artifactContents.content},
          'variants', ${artifactContents.variants},
          'metadata', ${artifactContents.metadata},
          'embed', ${artifactContents.embed},
          'annotations', ${artifactContents.annotations},
          'createdAt', ${artifactContents.createdAt},
          'createdBy', ${artifactContents.createdBy},
          'lastModifiedBy', ${artifactContents.lastModifiedBy}
        )) FILTER (WHERE ${artifactContents.id} IS NOT NULL),
        '[]'
      )
    `.as('contents');
  }

  if (options.includeProjects) {
    selectObject.projects = sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${projects.id},
          'accountId', ${projects.accountId},
          'name', ${projects.name},
          'status', ${projects.status},
          'createdAt', ${projects.createdAt},
          'updatedAt', ${projects.updatedAt}
        )) FILTER (WHERE ${projects.id} IS NOT NULL),
        '[]'
      )
    `.as('projects');
  }

  return selectObject;
}

export async function fetchAllArtifacts(
  accountId: string,
  options: ArtifactFetchOptions = {
    includeTags: true,
    includeContents: true,
    includeProjects: true
  }
): Promise<ArtifactWithRelations[]> {
  const selectObject = buildArtifactSelectObject(options);

  const query = db
    .select(selectObject)
    .from(artifacts)
    .where(eq(artifacts.accountId, accountId));

  if (options.includeContents) {
    query.leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId));
  }
  if (options.includeTags) {
    query.leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
         .leftJoin(tags, eq(artifactTags.tagId, tags.id));
  }
  if (options.includeProjects) {
    query.leftJoin(projectArtifactLinks, eq(artifacts.id, projectArtifactLinks.artifactId))
         .leftJoin(projects, eq(projectArtifactLinks.projectId, projects.id));
  }

  const result = await query
    .groupBy(artifacts.id)
    .orderBy(desc(artifacts.updatedAt));

  return result.map(artifact => parseArtifactResult(artifact, options));
}

export async function fetchSingleArtifact(
  accountId: string,
  artifactId: string,
  options: ArtifactFetchOptions = {
    includeTags: false,
    includeContents: false,
    includeProjects: false
  }
): Promise<ArtifactWithRelations | null> {
  const selectObject = buildArtifactSelectObject(options);

  const query = db
    .select(selectObject)
    .from(artifacts)
    .where(and(eq(artifacts.accountId, accountId), eq(artifacts.id, artifactId)));

  if (options.includeContents) {
    query.leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId));
  }
  if (options.includeTags) {
    query.leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
         .leftJoin(tags, eq(artifactTags.tagId, tags.id));
  }
  if (options.includeProjects) {
    query.leftJoin(projectArtifactLinks, eq(artifacts.id, projectArtifactLinks.artifactId))
         .leftJoin(projects, eq(projectArtifactLinks.projectId, projects.id));
  }

  const result = await query.groupBy(artifacts.id);

  if (result.length === 0) {
    return null;
  }

  return parseArtifactResult(result[0], options);
}

export async function fetchLatestArtifacts(
  accountId: string,
  limit: number = 5,
  options: ArtifactFetchOptions = {
    includeTags: false,
    includeContents: false,
    includeProjects: false
  }
): Promise<ArtifactWithRelations[]> {
  const selectObject = buildArtifactSelectObject(options);

  const query = db
    .select(selectObject)
    .from(artifacts)
    .where(eq(artifacts.accountId, accountId));

  if (options.includeContents) {
    query.leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId));
  }
  if (options.includeTags) {
    query.leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
         .leftJoin(tags, eq(artifactTags.tagId, tags.id));
  }
  if (options.includeProjects) {
    query.leftJoin(projectArtifactLinks, eq(artifacts.id, projectArtifactLinks.artifactId))
         .leftJoin(projects, eq(projectArtifactLinks.projectId, projects.id));
  }

  const result = await query
    .groupBy(artifacts.id)
    .orderBy(desc(artifacts.updatedAt))
    .limit(limit);

  return result.map(artifact => parseArtifactResult(artifact, options));
}

export async function searchArtifacts(
  accountId: string,
  query: string,
  options: ArtifactFetchOptions = {
    includeTags: false,
    includeContents: false,
    includeProjects: false
  }
): Promise<ArtifactWithRelations[]> {
  const selectObject = buildArtifactSelectObject(options);

  const baseQuery = db
    .select(selectObject)
    .from(artifacts)
    .where(and(
      eq(artifacts.accountId, accountId),
      ilike(artifacts.name, `%${query}%`)
    ));

  if (options.includeContents) {
    baseQuery.leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId));
  }
  if (options.includeTags) {
    baseQuery.leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
             .leftJoin(tags, eq(artifactTags.tagId, tags.id));
  }
  if (options.includeProjects) {
    baseQuery.leftJoin(projectArtifactLinks, eq(artifacts.id, projectArtifactLinks.artifactId))
             .leftJoin(projects, eq(projectArtifactLinks.projectId, projects.id));
  }

  const result = await baseQuery
    .groupBy(artifacts.id)
    .orderBy(desc(artifacts.updatedAt));

  return result.map(artifact => parseArtifactResult(artifact, options));
}

function parseArtifactResult(artifact: any, options: ArtifactFetchOptions): ArtifactWithRelations {
  const parsedArtifact: ArtifactWithRelations = {
    id: artifact.id,
    accountId: artifact.accountId,
    name: artifact.name,
    description: artifact.description,
    createdAt: new Date(artifact.createdAt),
    updatedAt: new Date(artifact.updatedAt),
    contents: artifact.contents,
    tags: artifact.tags,
    projects: artifact.projects,
  };

  if (options.includeContents && Array.isArray(artifact.contents)) {
    parsedArtifact.contents = artifact.contents.map((content: any) => ({
      id: content.id,
      accountId: content.accountId,
      type: content.type,
      content: content.content,
      variants: content.variants,
      metadata: content.metadata,
      embed: content.embed,
      annotations: content.annotations,
      createdAt: new Date(content.createdAt),
      createdBy: content.createdBy,
      lastModifiedBy: content.lastModifiedBy,
    }));
  }

  if (options.includeTags && Array.isArray(artifact.tags)) {
    parsedArtifact.tags = artifact.tags.map((tag: any) => ({
      id: tag.id,
      accountId: tag.accountId,
      name: tag.name,
    }));
  }

  if (options.includeProjects && Array.isArray(artifact.projects)) {
    parsedArtifact.projects = artifact.projects.map((project: any) => ({
      id: project.id,
      accountId: project.accountId,
      name: project.name,
      description: project.description,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      status: project.status,
    }));
  }

  return parsedArtifact;
}