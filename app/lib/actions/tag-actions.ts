import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import { tags, tagAssociations } from '../db/schema';
import { Tag } from '../definitions/definitions';

export async function createTag(name: string, accountId: string, tx: any = db): Promise<Tag> {
  const newTag = await tx.insert(tags)
    .values({ name, accountId })
    .returning();
  return newTag;
}

export async function updateTag(tagId: string, name: string, tx: any = db): Promise<Tag> {
  const updatedTag = await tx.update(tags)
    .set({ name })
    .where(eq(tags.id, tagId))
    .returning();
  return updatedTag;
}

export async function deleteTag(tagId: string, tx: any = db): Promise<void> {
  await tx.delete(tags)
    .where(eq(tags.id, tagId));
}

export async function associateTag(tagId: string, associatedId: string, entityType: 'project' | 'block', accountId: string, tx: any = db): Promise<void> {
  await tx.insert(tagAssociations)
    .values({
      tagId,
      associatedId,
      entityType,
      accountId
    })
    .onConflictDoNothing();
}

export async function disassociateTag(tagId: string, associatedId: string, entityType: 'project' | 'block', tx: any = db): Promise<void> {
  await tx.delete(tagAssociations)
    .where(and(
      eq(tagAssociations.tagId, tagId),
      eq(tagAssociations.associatedId, associatedId),
      eq(tagAssociations.entityType, entityType)
    ));
}

export async function getTagsByEntity(entityId: string, entityType: 'project' | 'block', tx: any = db): Promise<Tag[]> {
  return tx.select()
    .from(tags)
    .where(
      eq(tags.id, tx.select({ tagId: tagAssociations.tagId })
        .from(tagAssociations)
        .where(and(
          eq(tagAssociations.associatedId, entityId),
          eq(tagAssociations.entityType, entityType)
        ))
    ));
}