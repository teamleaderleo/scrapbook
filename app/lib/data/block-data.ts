'use server';

import { eq, and, or, ilike, sql, SQL, desc } from 'drizzle-orm';
import { db } from '../db/db';
import { blocks, blockContents, tags, tagAssociations, projectBlockLinks, projects } from '../db/schema';
import { BlockWithRelations } from "../definitions/definitions";

export async function fetchAllBlocks(accountId: string): Promise<BlockWithRelations[]> {
  const results = await db
    .select({
      id: blocks.id,
      accountId: blocks.accountId,
      name: blocks.name,
      description: blocks.description,
      createdAt: blocks.createdAt,
      updatedAt: blocks.updatedAt,
      contents: sql<any>`coalesce(json_agg(distinct jsonb_build_object(
        'id', ${blockContents.id},
        'accountId', ${blockContents.accountId},
        'type', ${blockContents.type},
        'content', ${blockContents.content},
        'metadata', ${blockContents.metadata},
        'createdAt', ${blockContents.createdAt},
        'createdBy', ${blockContents.createdBy},
        'lastModifiedBy', ${blockContents.lastModifiedBy}
      )) filter (where ${blockContents.id} is not null), '[]')`,
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
    .from(blocks)
    .leftJoin(blockContents, eq(blocks.id, blockContents.blockId))
    .leftJoin(tagAssociations, eq(blocks.id, tagAssociations.associatedId))
    .leftJoin(tags, eq(tagAssociations.tagId, tags.id))
    .leftJoin(projectBlockLinks, eq(blocks.id, projectBlockLinks.blockId))
    .leftJoin(projects, eq(projectBlockLinks.projectId, projects.id))
    .where(eq(blocks.accountId, accountId))
    .groupBy(blocks.id)
    .orderBy(desc(blocks.updatedAt));

  return results;
}