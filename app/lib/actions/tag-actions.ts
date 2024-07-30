'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '../db/db';
import { Tag } from '../definitions/definitions';
import { tags, tagAssociations } from '../db/schema';
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
      // Remove all associations
      await tx.delete(tagAssociations)
        .where(and(eq(tagAssociations.tagId, tagId), eq(tagAssociations.accountId, accountId)));

      // Delete the tag
      await tx.delete(tags)
        .where(and(eq(tags.id, tagId), eq(tags.accountId, accountId)));
    });

    revalidatePath('/dashboard/tags');
    return { success: true, message: 'Tag and all its associations deleted successfully.' };
  } catch (error) {
    console.error('Error deleting tag:', error);
    return { success: false, message: 'Failed to delete tag.' };
  }
}