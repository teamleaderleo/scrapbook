'use server';

import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db/db';
import { blockContents, blocks, projectArtifactLinks, projects, tagAssociations, tags, } from '../db/schema';
import { Artifact, BaseProject, ProjectWithArtifacts, Tag, } from "../definitions/definitions";


export async function fetchAllProjects(accountId: string): Promise<ProjectWithArtifacts[]> {
  const results = await db
    .select({
      id: projects.id,
      accountId: projects.accountId,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      status: projects.status,
      tags: sql<Tag[]>`json_agg(distinct jsonb_build_object(
        'id', ${tags.id},
        'name', ${tags.name}
      )) filter (where ${tags.id} is not null)`,
      blocks: sql<Artifact[]>`json_agg(distinct jsonb_build_object(
        'id', ${blocks.id},
        'name', ${blocks.name},
        'description', ${blocks.description},
        'createdAt', ${blocks.createdAt},
        'updatedAt', ${blocks.updatedAt},
        'contents', (
          select json_agg(jsonb_build_object(
            'id', ac.id,
            'type', ac.type,
            'content', ac.content,
            'metadata', ac.metadata,
            'createdAt', ac.created_at,
            'updatedAt', ac.updated_at,
            'createdBy', ac.created_by,
            'lastModifiedBy', ac.last_modified_by
          ))
          from ${blockContents} ac
          where ac.block_id = ${blocks.id}
        )
      )) filter (where ${blocks.id} is not null)`
    })
    .from(projects)
    .leftJoin(tagAssociations, and(
      eq(tagAssociations.associatedId, projects.id),
      eq(tagAssociations.accountId, projects.accountId)
    ))
    .leftJoin(tags, eq(tags.id, tagAssociations.tagId))
    .leftJoin(projectArtifactLinks, eq(projectArtifactLinks.projectId, projects.id))
    .leftJoin(blocks, eq(blocks.id, projectArtifactLinks.blockId))
    .where(eq(projects.accountId, accountId))
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt));

  return results;
}

// export async function fetchProjectsWithExtendedArtifacts(accountId: string): Promise<ProjectWithExtendedArtifacts[]> {
//   // Similar to fetchAllProjects, but include block tags and projects
//   // ...
// }

// export async function fetchProjectsWithTags(accountId: string): Promise<ProjectWithTags[]> {
//   // Fetch projects with tags, but no blocks
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