'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projects, projectTags, tags, projectArtifactLinks, artifacts, artifactContents, artifactTags } from '../db/schema';
import { ProjectWithTags, ProjectWithArtifacts, ProjectWithExtendedArtifacts, FetchOptions } from '../definitions';

export async function fetchAllProjects(
  accountId: string,
  options: FetchOptions = {}
): Promise<(ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts)[]> {
  const query = db
    .select({
      project: projects,
      tag: tags,
      artifact: artifacts,
      artifactContent: artifactContents,
      artifactTag: artifactTags,
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

  const results = await query;

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
      if (!project.tags.some((t: any) => t.id === row.tag.id)) {
        project.tags.push(row.tag);
      }
    }

    if (options.includeArtifacts !== 'none' && row.artifact) {
      let existingArtifact = project.artifacts.find((a: any) => a.id === row.artifact.id);
      if (!existingArtifact) {
        existingArtifact = {
          ...row.artifact,
          contents: [],
          tags: [],
        };
        project.artifacts.push(existingArtifact);
      }

      if (row.artifactContent && !existingArtifact.contents.some((c: any) => c.id === row.artifactContent.id)) {
        existingArtifact.contents.push(row.artifactContent);
      }

      if (options.includeArtifacts === 'extended' && row.artifactTag &&
          !existingArtifact.tags.some((t: any) => t.id === row.artifactTag.id)) {
        existingArtifact.tags.push(row.artifactTag);
      }
    }
  }

  return Array.from(projectMap.values());
}