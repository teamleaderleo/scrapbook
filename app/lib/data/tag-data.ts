'use server';

import { eq, } from 'drizzle-orm';
import { db } from '../db/db.server';
import { Tag } from '../definitions';
import { tags } from '../db/schema';

export async function fetchAllTags(accountId: string): Promise<Tag[]> {
  return db.select().from(tags).where(eq(tags.accountId, accountId));
}