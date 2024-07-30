'use server';

import { eq, and, count, sql } from 'drizzle-orm';
import { db } from '../db/db';
import { Tag } from '../definitions/definitions';
import { tags, tagAssociations } from '../db/schema';

export async function fetchAllTags(accountId: string): Promise<Tag[]> {
  return db.select().from(tags).where(eq(tags.accountId, accountId));
}

export async function fetchTagUsage(accountId: string, tagId: string): Promise<{ [key: string]: number }> {
  const results = await db
    .select({
      entityType: tagAssociations.entityType,
      count: count(),
    })
    .from(tagAssociations)
    .where(and(eq(tagAssociations.tagId, tagId), eq(tagAssociations.accountId, accountId)))
    .groupBy(tagAssociations.entityType);

  const usage: { [key: string]: number } = {};
  for (const result of results) {
    usage[result.entityType] = Number(result.count);
  }

  return usage;
}