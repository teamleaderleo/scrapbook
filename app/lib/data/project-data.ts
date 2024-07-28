'use server';

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projects, projectTags, tags, projectArtifactLinks, artifacts, artifactContents, artifactTags } from '../db/schema';
import { ProjectWithTags, ProjectWithArtifacts, ProjectWithExtendedArtifacts, FetchOptions } from '../definitions';

export async function fetchAllProjects(
  accountId: string,
  options: FetchOptions = {}
): Promise<(ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts)[]> {
  const query = db
    .select({
      project: {
        id: projects.id,
        accountId: projects.accountId,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        status: projects.status,
      },
      ...(options.includeTags ? {
        tag: {
          id: tags.id,
          name: tags.name,
        },
      } : {}),
      ...(options.includeArtifacts !== 'none' ? {
        artifact: {
          id: artifacts.id,
          name: artifacts.name,
          description: artifacts.description,
          createdAt: artifacts.createdAt,
          updatedAt: artifacts.updatedAt,
        },
        ...(options.includeArtifacts === 'withContents' || options.includeArtifacts === 'extended' ? {
          artifactContent: {
            id: artifactContents.id,
            type: artifactContents.type,
            content: artifactContents.content,
          },
        } : {}),
        ...(options.includeArtifacts === 'extended' ? {
          artifactTag: {
            id: artifactTags.artifactId,
            name: tags.name,
          },
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

function parseProjectResults(results: any[], options: FetchOptions): (ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts)[] {
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