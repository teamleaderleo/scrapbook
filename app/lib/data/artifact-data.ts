'use server';

import { eq, and, or, ilike, sql, SQL, desc } from 'drizzle-orm';
import { db } from '../db/db';
import { artifacts, artifactContents, tags, tagAssociations, projectArtifactLinks, projects } from '../db/schema';
import { ArtifactWithRelations } from "../definitions/definitions";

export async function fetchAllArtifacts(accountId: string): Promise<ArtifactWithRelations[]> {
  const results = await db
    .select({
      id: artifacts.id,
      accountId: artifacts.accountId,
      name: artifacts.name,
      description: artifacts.description,
      createdAt: artifacts.createdAt,
      updatedAt: artifacts.updatedAt,
      contents: sql<any>`coalesce(json_agg(distinct jsonb_build_object(
        'id', ${artifactContents.id},
        'accountId', ${artifactContents.accountId},
        'type', ${artifactContents.type},
        'content', ${artifactContents.content},
        'metadata', ${artifactContents.metadata},
        'createdAt', ${artifactContents.createdAt},
        'createdBy', ${artifactContents.createdBy},
        'lastModifiedBy', ${artifactContents.lastModifiedBy}
      )) filter (where ${artifactContents.id} is not null), '[]')`,
      tags: sql<any>`coalesce(json_agg(distinct jsonb_build_object(
        'id', ${tags.id},
        'accountId', ${tags.accountId},
        'name', ${tags.name}
      )) filter (where ${tags.id} is not null), '[]')`,
      projects: sql<any>`coalesce(json_agg(distinct jsonb_build_object(
        'id', ${projects.id},
        'accountId', ${projects.accountId},
        'name', ${projects.name},
        'status', ${projects.status},
        'createdAt', ${projects.createdAt},
        'updatedAt', ${projects.updatedAt}
      )) filter (where ${projects.id} is not null), '[]')`
    })
    .from(artifacts)
    .leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId))
    .leftJoin(tagAssociations, eq(artifacts.id, tagAssociations.associatedId))
    .leftJoin(tags, eq(tagAssociations.tagId, tags.id))
    .leftJoin(projectArtifactLinks, eq(artifacts.id, projectArtifactLinks.artifactId))
    .leftJoin(projects, eq(projectArtifactLinks.projectId, projects.id))
    .where(eq(artifacts.accountId, accountId))
    .groupBy(artifacts.id)
    .orderBy(desc(artifacts.updatedAt));

  return results;
}