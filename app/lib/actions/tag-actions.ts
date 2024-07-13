'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '../db/db.server';
import { Tag } from '../definitions';
import { tags, projectTags, artifactTags } from '../db/schema';
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
      await tx.delete(projectTags).where(and(eq(projectTags.tagId, tagId), eq(projectTags.accountId, accountId)));
      await tx.delete(artifactTags).where(and(eq(artifactTags.tagId, tagId), eq(artifactTags.accountId, accountId)));
      await tx.delete(tags).where(and(eq(tags.id, tagId), eq(tags.accountId, accountId)));
    });
    revalidatePath('/dashboard/tags');
    return { success: true, message: 'Tag deleted successfully.' };
  } catch (error) {
    console.error('Error deleting tag:', error);
    return { success: false, message: 'Failed to delete tag.' };
  }
}

export async function getTagUsage(accountId: string, tagId: string): Promise<{ projectCount: number; artifactCount: number }> {
  const projectCount = await db.select({ count: projectTags.tagId })
    .from(projectTags)
    .where(and(eq(projectTags.tagId, tagId), eq(projectTags.accountId, accountId)))
    .execute();

  const artifactCount = await db.select({ count: artifactTags.tagId })
    .from(artifactTags)
    .where(and(eq(artifactTags.tagId, tagId), eq(artifactTags.accountId, accountId)))
    .execute();

  return {
    projectCount: projectCount.length,
    artifactCount: artifactCount.length
  };
}

export async function getAllTags(accountId: string): Promise<Tag[]> {
  return db.select().from(tags).where(eq(tags.accountId, accountId));
}