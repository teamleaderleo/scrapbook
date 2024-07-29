'use server';

import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db/db';
import { projects, projectWithArtifactsView } from '../db/schema';
import { BaseProject, ProjectWithArtifactsView, ProjectWithArtifactsViewSchema } from "../definitions/definitions";


export async function fetchAllProjects(accountId: string): Promise<ProjectWithArtifactsView[]> {
  const rawResults = await db
    .select()
    .from(projectWithArtifactsView)
    .where(eq(projectWithArtifactsView.accountId, accountId));
  
  return rawResults.map(row => ProjectWithArtifactsViewSchema.parse(row));
}

// export async function fetchProjectsWithExtendedArtifacts(accountId: string): Promise<ProjectWithExtendedArtifacts[]> {
//   // Similar to fetchAllProjects, but include artifact tags and projects
//   // ...
// }

// export async function fetchProjectsWithTags(accountId: string): Promise<ProjectWithTags[]> {
//   // Fetch projects with tags, but no artifacts
//   // ...
// }

export async function fetchProjectsBasic(accountId: string): Promise<BaseProject[]> {
  const results = await db
    .select()
    .from(projects)
    .where(eq(projects.accountId, accountId))
    .orderBy(desc(projects.updatedAt));
  return results;
}