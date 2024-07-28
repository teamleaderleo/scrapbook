'use server';

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projects, projectTags, tags, projectArtifactLinks, artifacts, artifactContents, artifactTags } from '../db/schema';
import { ProjectWithTags, ProjectWithArtifacts, ProjectWithExtendedArtifacts, ProjectFetchOptions } from '../definitions';
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
    .where(eq(projects.accountId, sql.placeholder('accountId')))
    .leftJoin(projectTags, eq(projects.id, projectTags.projectId))
    .leftJoin(tags, eq(projectTags.tagId, tags.id))
    .leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
    .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id))
    .leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId))
    .leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
    .orderBy(desc(projects.updatedAt));

  const preparedQuery = query.prepare('fetch_all_projects');
  const results = await preparedQuery.execute({ accountId });

  return parseProjectResults(results, options);
}

export async function fetchProjectSkeletons(accountId: string) {
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

export async function fetchProjectPreviews(accountId: string) {
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
    .leftJoin(artifactContents, and(
      eq(artifactContents.artifactId, artifacts.id),
    ))
    .where(eq(projects.accountId, accountId))
    .orderBy(desc(projects.updatedAt))
    .limit(1);  // Assuming we want one preview image per project
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