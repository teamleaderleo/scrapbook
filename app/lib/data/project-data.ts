'use server';

import { eq, and, or, ilike, sql, desc } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projects, projectTags, tags, projectArtifactLinks, artifacts, artifactContents } from '../db/schema';
import { ProjectWithRelations, FetchOptions } from '../definitions';

function buildProjectSelectObject(options: FetchOptions = {}): Record<string, any> {
  const selectObject: Record<string, any> = {
    id: projects.id,
    accountId: projects.accountId,
    name: projects.name,
    description: projects.description,
    createdAt: projects.createdAt,
    updatedAt: projects.updatedAt,
    status: projects.status,
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

  if (options.includeArtifacts) {
    selectObject.artifacts = sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${artifacts.id},
          'name', ${artifacts.name},
          'contents', (
            SELECT jsonb_agg(jsonb_build_object(
              'id', ${artifactContents.id},
              'type', ${artifactContents.type},
              'content', ${artifactContents.content},
              'createdAt', ${artifactContents.createdAt}
            ))
            FROM ${artifactContents}
            WHERE ${artifactContents.artifactId} = ${artifacts.id} 
              AND ${artifactContents.accountId} = ${projects.accountId}
          )
        )) FILTER (WHERE ${artifacts.id} IS NOT NULL),
        '[]'
      )
    `.as('artifacts');
  }

  return selectObject;
}

export async function fetchSingleProject(
  accountId: string,
  projectId: string,
  options: FetchOptions = {}
): Promise<ProjectWithRelations | null> {
  const selectObject = buildProjectSelectObject(options);

  const query = db
    .select(selectObject)
    .from(projects)
    .where(and(eq(projects.accountId, accountId), eq(projects.id, projectId)));

  if (options.includeTags) {
    query.leftJoin(projectTags, eq(projects.id, projectTags.projectId))
         .leftJoin(tags, eq(projectTags.tagId, tags.id));
  }
  if (options.includeArtifacts) {
    query.leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
         .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id));
  }

  const result = await query.groupBy(projects.id);

  if (result.length === 0) {
    return null;
  }

  return parseProjectResult(result[0], options);
}

export async function fetchLatestProjects(
  accountId: string,
  limit: number = 5,
  options: FetchOptions = {}
): Promise<ProjectWithRelations[]> {
  const selectObject = buildProjectSelectObject(options);

  const query = db
    .select(selectObject)
    .from(projects)
    .where(eq(projects.accountId, accountId));

  if (options.includeTags) {
    query.leftJoin(projectTags, eq(projects.id, projectTags.projectId))
         .leftJoin(tags, eq(projectTags.tagId, tags.id));
  }
  if (options.includeArtifacts) {
    query.leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
         .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id));
  }

  const result = await query
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt))
    .limit(limit);

  return result.map(project => parseProjectResult(project, options));
}

export async function fetchAllProjects(
  accountId: string,
  options: FetchOptions = {}
): Promise<ProjectWithRelations[]> {
  const selectObject = buildProjectSelectObject(options);

  const query = db
    .select(selectObject)
    .from(projects)
    .where(eq(projects.accountId, accountId));

  if (options.includeTags) {
    query.leftJoin(projectTags, eq(projects.id, projectTags.projectId))
         .leftJoin(tags, eq(projectTags.tagId, tags.id));
  }
  if (options.includeArtifacts) {
    query.leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
         .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id));
  }

  const result = await query
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt));

  return result.map(project => parseProjectResult(project, options));
}

export async function searchProjects(
  accountId: string,
  query: string,
  options: FetchOptions = {}
): Promise<ProjectWithRelations[]> {
  const selectObject = buildProjectSelectObject(options);

  const baseQuery = db
    .select(selectObject)
    .from(projects)
    .where(and(
      eq(projects.accountId, accountId),
      or(
        ilike(projects.name, `%${query}%`),
        ilike(projects.description, `%${query}%`)
      )
    ));

  if (options.includeTags) {
    baseQuery.leftJoin(projectTags, eq(projects.id, projectTags.projectId))
             .leftJoin(tags, eq(projectTags.tagId, tags.id));
  }
  if (options.includeArtifacts) {
    baseQuery.leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
             .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id));
  }

  const result = await baseQuery
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt));

  return result.map(project => parseProjectResult(project, options));
}

function parseProjectResult(project: any, options: FetchOptions): ProjectWithRelations {
  const parsedProject: ProjectWithRelations = {
    id: project.id,
    accountId: project.accountId,
    name: project.name,
    description: project.description,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    status: project.status,
    tags: project.tags,
    artifacts: project.artifacts,
  };

  if (options.includeTags && Array.isArray(project.tags)) {
    parsedProject.tags = project.tags.map((tag: any) => ({
      id: tag.id,
      accountId: tag.accountId,
      name: tag.name,
    }));
  }

  if (options.includeArtifacts && Array.isArray(project.artifacts)) {
    parsedProject.artifacts = project.artifacts.map((artifact: any) => ({
      id: artifact.id,
      name: artifact.name,
      contents: Array.isArray(artifact.contents) ? artifact.contents.map((content: any) => ({
        id: content.id,
        type: content.type,
        content: content.content,
        createdAt: new Date(content.createdAt),
      })) : [],
    }));
  }

  return parsedProject;
}