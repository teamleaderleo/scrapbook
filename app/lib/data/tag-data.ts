'use server';

import { eq, and, count } from 'drizzle-orm';
import { db } from '../db/db';
import { Tag } from '../definitions/definitions';
import { tags, projectTags, artifactTags } from '../db/schema';

export async function fetchAllTags(accountId: string): Promise<Tag[]> {
  return db.select().from(tags).where(eq(tags.accountId, accountId));
}

export async function fetchTagUsage(accountId: string, tagId: string): Promise<{ projectCount: number; artifactCount: number }> {
  const [projectCount] = await db
    .select({ count: count() })
    .from(projectTags)
    .where(and(eq(projectTags.tagId, tagId), eq(projectTags.accountId, accountId)));

  const [artifactCount] = await db
    .select({ count: count() })
    .from(artifactTags)
    .where(and(eq(artifactTags.tagId, tagId), eq(artifactTags.accountId, accountId)));

  return {
    projectCount: Number(projectCount?.count) || 0,
    artifactCount: Number(artifactCount?.count) || 0,
  };
}