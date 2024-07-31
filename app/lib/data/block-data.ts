'use server';

import { eq, and, or, ilike, sql, SQL, desc } from 'drizzle-orm';
import { db } from '../db/db';
import { blocks, tags, tagAssociations, projectBlockLinks, projects } from '../db/schema';
import { BaseProject, BlockWithRelations, Tag } from "../definitions/definitions";

export async function fetchAllBlocks(accountId: string): Promise<BlockWithRelations[]> {
  const results = await db
    .select({
      id: blocks.id,
      accountId: blocks.accountId,
      createdAt: blocks.createdAt,
      updatedAt: blocks.updatedAt,
      content: blocks.content,
      createdBy: blocks.createdBy,
      lastModifiedBy: blocks.lastModifiedBy,
      tags: sql<Tag[]>`coalesce(json_agg(distinct jsonb_build_object(
        'id', ${tags.id},
        'accountId', ${tags.accountId},
        'name', ${tags.name}
      )) filter (where ${tags.id} is not null), '[]')`,
      projects: sql<BaseProject[]>`coalesce(json_agg(distinct jsonb_build_object(
        'id', ${projects.id},
        'accountId', ${projects.accountId},
        'name', ${projects.name},
        'status', ${projects.status},
        'createdAt', ${projects.createdAt},
        'updatedAt', ${projects.updatedAt}
      )) filter (where ${projects.id} is not null), '[]')`,
    })
    .from(blocks)
    .leftJoin(tagAssociations, eq(blocks.id, tagAssociations.associatedId))
    .leftJoin(tags, eq(tagAssociations.tagId, tags.id))
    .leftJoin(projectBlockLinks, eq(blocks.id, projectBlockLinks.blockId))
    .leftJoin(projects, eq(projectBlockLinks.projectId, projects.id))
    .where(eq(blocks.accountId, accountId))
    .groupBy(blocks.id)
    .orderBy(desc(blocks.updatedAt));

  return results;
}