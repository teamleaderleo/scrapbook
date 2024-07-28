'use server';

import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projects, projectTags, tags, projectArtifactLinks, artifacts, artifactContents, artifactTags } from '../db/schema';
import { ProjectFetchOptions, Tag } from '../definitions/definitions';
import { ProjectWithTags, ProjectWithArtifacts, ProjectWithExtendedArtifacts } from "../definitions/project-definitions";
import { artifactTagSelect, baseProjectSelect, tagSelect, artifactSelect, artifactContentSelect } from './select-objects';

export async function fetchAllProjects(
  accountId: string,
  options: ProjectFetchOptions = {
    includeTags: false,
    includeArtifacts: 'none'
  }
): Promise<(ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts)[]> {
  const query = db
    .select({
      project: baseProjectSelect,
      ...(options.includeTags ? { tag: tagSelect } : {}),
      ...(options.includeArtifacts !== 'none' ? {
        artifact: artifactSelect,
        ...(options.includeArtifacts === 'withContents' || options.includeArtifacts === 'extended' ? {
          artifactContent: artifactContentSelect,
        } : {}),
        ...(options.includeArtifacts === 'extended' ? {
          artifactTag: artifactTagSelect,
        } : {}),
      } : {}),
    })
    .from(projects)
    .where(eq(projects.accountId, accountId))
    .leftJoin(projectTags, eq(projects.id, projectTags.projectId))
    .leftJoin(tags, eq(projectTags.tagId, tags.id))
    .leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
    .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id))
    .leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId))
    .leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
    .orderBy(desc(projects.updatedAt));

  const results = await query.execute();
  return parseProjectResults(results, options);
}

export async function fetchProjectBasics(accountId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
    })
    .from(projects)
    .where(eq(projects.accountId, accountId))
    .orderBy(desc(projects.updatedAt));
}

export async function fetchProjectPreviews(projectIds: string[]) {
  return db
    .select({
      ...baseProjectSelect,
      previewArtifact: {
        id: artifacts.id,
        name: artifacts.name,
        previewContent: artifactContents.content,
      },
    })
    .from(projects)
    .leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
    .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id))
    .leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId))
    .where(inArray(projects.id, projectIds))
    .groupBy(
      projects.id, 
      projects.accountId, 
      projects.name, 
      projects.description, 
      projects.createdAt, 
      projects.updatedAt, 
      projects.status,
      artifacts.id, 
      artifacts.name, 
      artifactContents.content
    );
}

export async function fetchProjectDetails(projectId: string): Promise<ProjectWithTags> {
  const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  
  if (!project[0]) {
    throw new Error(`Project with id ${projectId} not found`);
  }

  const projectTagsResult = await db.select({
    id: tags.id,
    name: tags.name,
    accountId: tags.accountId
  })
  .from(projectTags)
  .innerJoin(tags, eq(tags.id, projectTags.tagId))
  .where(eq(projectTags.projectId, projectId));

  return {
    ...project[0],
    description: project[0].description || undefined,
    status: project[0].status as "pending" | "completed",
    tags: projectTagsResult as Tag[]
  };
}

function parseProjectResults(results: any[], options: ProjectFetchOptions): (ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts)[] {
  const projectMap = new Map();

  for (const row of results) {
    if (!projectMap.has(row.project.id)) {
      projectMap.set(row.project.id, {
        ...row.project,
        tags: [],
        artifacts: [],
      });
    }

    const project = projectMap.get(row.project.id);

    if (options.includeTags && row.tag) {
      if (!project.tags.some((t: { id: any; }) => t.id === row.tag.id)) {
        project.tags.push(row.tag);
      }
    }

    if (options.includeArtifacts !== 'none' && row.artifact) {
      let artifact = project.artifacts.find((a: { id: any; }) => a.id === row.artifact.id);
      if (!artifact) {
        artifact = {
          ...row.artifact,
          contents: [],
          tags: [],
        };
        project.artifacts.push(artifact);
      }

      if (row.artifactContent) {
        if (!artifact.contents.some((c: { id: any; }) => c.id === row.artifactContent.id)) {
          artifact.contents.push(row.artifactContent);
        }
      }

      if (options.includeArtifacts === 'extended' && row.artifactTag) {
        if (!artifact.tags.some((t: { id: any; }) => t.id === row.artifactTag.id)) {
          artifact.tags.push(row.artifactTag);
        }
      }
    }
  }

  return Array.from(projectMap.values());
}