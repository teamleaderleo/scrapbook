'use server';

import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../db/db';
import { Tag } from '../definitions/definitions';
import { tags, tagAssociations } from '../db/schema';
import { v4 as uuid } from 'uuid';

export async function handleTagUpdateWithinTransaction(
    tx: any,
    accountId: string,
    associatedId: string,
    newTags: string[]
): Promise<void> {
  // Remove existing associations for this item
  await tx.delete(tagAssociations)
    .where(and(
      eq(tagAssociations.associatedId, associatedId),
      eq(tagAssociations.accountId, accountId)
    ));

  // Add new associations
  for (const tagName of newTags) {
    const existingTags = await tx.select().from(tags)
      .where(and(eq(tags.name, tagName), eq(tags.accountId, accountId)))
      .limit(1);

    let tagId: string;
    if (existingTags.length > 0) {
      tagId = existingTags[0].id;
    } else {
      tagId = uuid();
      await tx.insert(tags).values({ id: tagId, name: tagName, accountId });
    }

    await tx.insert(tagAssociations)
      .values({
        id: uuid(),
        accountId,
        associatedId,
        tagId,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: 0 // You might want to implement a more sophisticated ordering system
      })
      .onConflictDoNothing();
  }
}

export async function handleTagUpdate(
  accountId: string,
  associatedId: string,
  newTags: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    await handleTagUpdateWithinTransaction(tx, accountId, associatedId, newTags);
  });
}

export async function ensureTagsExistWithinTransaction(
  tx: any,
  accountId: string,
  tagNames: string[]
): Promise<Tag[]> {
  const existingTags = await tx.select().from(tags)
    .where(and(
      eq(tags.accountId, accountId),
      inArray(tags.name, tagNames)
    ));

  const existingTagNames = new Set(existingTags.map((tag: Tag) => tag.name));
  const newTagNames = tagNames.filter(name => !existingTagNames.has(name));

  const createdTags: Tag[] = [];
  for (const name of newTagNames) {
    const newTag = { id: uuid(), accountId, name };
    await tx.insert(tags).values(newTag);
    createdTags.push(newTag);
  }

  return [...existingTags, ...createdTags];
}

export async function ensureTagsExist(
  accountId: string,
  tagNames: string[]
): Promise<Tag[]> {
  return db.transaction(async (tx) => {
    return ensureTagsExistWithinTransaction(tx, accountId, tagNames);
  });
}