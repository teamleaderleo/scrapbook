'use server';

import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../db/db';
import { EntityType, Tag } from '../definitions/definitions';
import { tags, tagAssociations } from '../db/schema';
import { v4 as uuid } from 'uuid';

export async function handleTagUpdateWithinTransaction(
    tx: any,
    accountId: string,
    associatedId: string,
    entityType: EntityType,
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
        entityType, // Add this line
        createdAt: new Date(),
        updatedAt: new Date(),
        order: 0
      })
      .onConflictDoNothing();
  }
}

export async function handleTagUpdate(
  accountId: string,
  associatedId: string,
  entityType: EntityType,
  newTags: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    await handleTagUpdateWithinTransaction(tx, accountId, associatedId, entityType, newTags);
  });
}