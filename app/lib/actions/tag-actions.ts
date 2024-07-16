'use server';

import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '../db/db.server';
import { Tag } from '../definitions';
import { tags } from '../db/schema';
import { handleTagUpdateWithinTransaction, ensureTagsExistWithinTransaction } from './tag-handlers';
import { v4 as uuid } from 'uuid';

export async function createTag(accountId: string, name: string): Promise<Tag> {
  const newTagId = uuid();
  await db.insert(tags).values({ id: newTagId, accountId, name });
  revalidatePath('/dashboard/tags');
  return { id: newTagId, accountId, name };
}

export async function updateTag(accountId: string, tagId: string, newName: string): Promise<Tag> {
  await db.update(tags)
    .set({ name: newName })
    .where(and(eq(tags.id, tagId), eq(tags.accountId, accountId)));
  revalidatePath('/dashboard/tags');
  return { id: tagId, accountId, name: newName };
}

export async function deleteTag(accountId: string, tagId: string): Promise<{ success: boolean; message: string }> {
  try {
    await db.transaction(async (tx) => {
      await handleTagUpdateWithinTransaction(tx, accountId, tagId, [], true);
      await handleTagUpdateWithinTransaction(tx, accountId, tagId, [], false);
      await tx.delete(tags).where(and(eq(tags.id, tagId), eq(tags.accountId, accountId)));
    });
    revalidatePath('/dashboard/tags');
    return { success: true, message: 'Tag deleted successfully.' };
  } catch (error) {
    console.error('Error deleting tag:', error);
    return { success: false, message: 'Failed to delete tag.' };
  }
}

export async function ensureTagsExist(accountId: string, tagNames: string[]): Promise<Tag[]> {
  return db.transaction(async (tx) => {
    return ensureTagsExistWithinTransaction(tx, accountId, tagNames);
  });
}

export async function getAllTags(accountId: string): Promise<Tag[]> {
  return db.select().from(tags).where(eq(tags.accountId, accountId));
}