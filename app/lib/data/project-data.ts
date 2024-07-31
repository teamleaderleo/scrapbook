'use server';

import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db/db';
import { blocks, projectBlockLinks, projects, tagAssociations, tags, } from '../db/schema';
import { Block, BaseProject, ProjectWithBlocks, Tag, } from "../definitions/definitions";


export async function fetchAllProjects(accountId: string): Promise<ProjectWithBlocks[]> {
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
      blocks: sql<Block[]>`json_agg(distinct jsonb_build_object(
        'id', ${blocks.id},
        'createdAt', ${blocks.createdAt},
        'updatedAt', ${blocks.updatedAt},
        'content', ${blocks.content},
        'createdBy': ${blocks.createdAt},
        'lastModifiedBy': ${blocks.lastModifiedBy},
      )) filter (where ${blocks.id} is not null)`
    })
    .from(projects)
    .leftJoin(tagAssociations, eq(tagAssociations.associatedId, projects.id))
    .leftJoin(tags, eq(tags.id, tagAssociations.tagId))
    .leftJoin(projectBlockLinks, eq(projectBlockLinks.projectId, projects.id))
    .leftJoin(blocks, eq(blocks.id, projectBlockLinks.blockId))
    .where(eq(projects.accountId, accountId))
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt));

  return results;
}

// export async function fetchProjectsWithExtendedBlocks(accountId: string): Promise<ProjectWithExtendedBlocks[]> {
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