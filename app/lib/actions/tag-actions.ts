'use server';

import { eq, and, inArray } from 'drizzle-orm';
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

async function updateTagsCore(tx: any, accountId: string, itemId: string, newTags: string[], isProject: boolean) {
  const tagsTable = isProject ? projectTags : artifactTags;
  const itemColumn = isProject ? projectTags.projectId : artifactTags.artifactId;

  // Add new tags
  for (const tagName of newTags) {
    const existingTag = await tx.select().from(tags)
      .where(and(eq(tags.name, tagName), eq(tags.accountId, accountId)))
      .limit(1);

    let tagId: string;
    if (existingTag.length === 0) {
      tagId = uuid();
      await tx.insert(tags).values({ id: tagId, name: tagName, accountId });
    } else {
      tagId = existingTag[0].id;
    }

    await tx.insert(tagsTable).values({
      accountId,
      [isProject ? 'projectId' : 'artifactId']: itemId,
      tagId
    });
  }
}

// For use within an existing transaction
export async function handleTagUpdateWithinTransaction(
  tx: any,
  accountId: string,
  itemId: string,
  newTags: string[],
  isProject: boolean = false
): Promise<void> {
  await updateTagsCore(tx, accountId, itemId, newTags, isProject);
}

// For standalone use
export async function handleTagUpdate(
  accountId: string,
  itemId: string,
  newTags: string[],
  isProject: boolean = false
): Promise<void> {
  await db.transaction(async (tx) => {
    await updateTagsCore(tx, accountId, itemId, newTags, isProject);
  });
}

export async function ensureTagsExist(accountId: string, tagNames: string[]): Promise<Tag[]> {
  const existingTags = await db.select().from(tags)
    .where(and(
      eq(tags.accountId, accountId),
      inArray(tags.name, tagNames)
    ));

  const existingTagNames = new Set(existingTags.map(tag => tag.name));
  const newTagNames = tagNames.filter(name => !existingTagNames.has(name));

  const newTags = await db.transaction(async (tx) => {
    const createdTags: Tag[] = [];
    for (const name of newTagNames) {
      const newTag = { id: uuid(), accountId, name };
      await tx.insert(tags).values(newTag);
      createdTags.push(newTag);
    }
    return createdTags;
  });

  return [...existingTags, ...newTags];
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