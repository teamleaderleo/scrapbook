'use server';

import { eq, desc, inArray } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projects } from '../db/schema';
import { ProjectFetchOptions } from '../definitions/definitions';
import { ProjectWithTags, ProjectWithArtifacts, ProjectWithExtendedArtifacts, ProjectBasic, ProjectPreview } from "../definitions/project-definitions";
import { createProjectQuery, createProjectBasicsQuery, createProjectPreviewQuery } from './projects/query-builders';

export async function fetchAllProjects(
  accountId: string,
  options: ProjectFetchOptions = {
    includeTags: false,
    includeArtifacts: 'basic'
  }
): Promise<(ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts)[]> {
  const query = createProjectQuery(db, [eq(projects.accountId, accountId)], options)
    .orderBy(desc(projects.updatedAt));

  const results = await query.execute();
  return parseProjectResults(results, options);
}

export async function fetchProjectBasics(accountId: string): Promise<ProjectBasic[]> {
  return createProjectBasicsQuery(db, [eq(projects.accountId, accountId)])
    .orderBy(desc(projects.updatedAt));
}

export async function fetchProjectPreviews(projectIds: string[]): Promise<ProjectPreview[]> {
  return createProjectPreviewQuery(db, [inArray(projects.id, projectIds)])
    .groupBy(projects.id, projects.accountId, projects.name, projects.description, projects.createdAt, projects.updatedAt, projects.status);
}

export async function fetchProjectDetails(projectId: string): Promise<ProjectWithTags> {
  const result = await createProjectQuery(db, [eq(projects.id, projectId)], { includeTags: true, includeArtifacts: 'withContents' })
    .limit(1);

  if (!result[0]) {
    throw new Error(`Project with id ${projectId} not found`);
  }

  return result[0] as ProjectWithTags;
}

function parseProjectResults(results: any[], options: ProjectFetchOptions): (ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts)[] {
  return results.map(row => {
    const project = { ...row.project };
    
    if (options.includeTags) {
      project.tags = row.tags ? [row.tags] : [];
    }

    if (options.includeArtifacts !== 'none') {
      project.artifacts = row.artifacts ? [row.artifacts] : [];
      if (options.includeArtifacts === 'withContents' || options.includeArtifacts === 'extended') {
        project.artifacts.forEach((artifact: any) => {
          artifact.contents = artifact.contents ? [artifact.contents] : [];
        });
      }
      if (options.includeArtifacts === 'extended') {
        project.artifacts.forEach((artifact: any) => {
          artifact.tags = artifact.tags ? [artifact.tags] : [];
        });
      }
    }

    return project;
  });
}