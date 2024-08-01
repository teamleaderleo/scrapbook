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

// Tag association operations
export async function associateTagWithProject(tagId: string, projectId: string, accountId: string, tx: any = db): Promise<void> {
  await tx.insert(tagAssociations)
    .values({ tagId, associatedId: projectId, entityType: 'project', accountId })
    .onConflictDoNothing();
}

export async function associateTagWithBlock(tagId: string, blockId: string, accountId: string, tx: any = db): Promise<void> {
  await tx.insert(tagAssociations)
    .values({ tagId, associatedId: blockId, entityType: 'block', accountId })
    .onConflictDoNothing();
}

export async function disassociateTagFromProject(tagId: string, projectId: string, tx: any = db): Promise<void> {
  await tx.delete(tagAssociations)
    .where(eq(tagAssociations.tagId, tagId))
    .where(eq(tagAssociations.associatedId, projectId))
    .where(eq(tagAssociations.entityType, 'project'));
}

export async function disassociateTagFromBlock(tagId: string, blockId: string, tx: any = db): Promise<void> {
  await tx.delete(tagAssociations)
    .where(eq(tagAssociations.tagId, tagId))
    .where(eq(tagAssociations.associatedId, blockId))
    .where(eq(tagAssociations.entityType, 'block'));
}

export async function getTagsForProject(projectId: string, tx: any = db): Promise<Tag[]> {
  return tx.select({ id: tags.id, name: tags.name, accountId: tags.accountId })
    .from(tags)
    .innerJoin(tagAssociations, eq(tags.id, tagAssociations.tagId))
    .where(eq(tagAssociations.associatedId, projectId))
    .where(eq(tagAssociations.entityType, 'project'));
}

export async function getTagsForBlock(blockId: string, tx: any = db): Promise<Tag[]> {
  return tx.select({ id: tags.id, name: tags.name, accountId: tags.accountId })
    .from(tags)
    .innerJoin(tagAssociations, eq(tags.id, tagAssociations.tagId))
    .where(eq(tagAssociations.associatedId, blockId))
    .where(eq(tagAssociations.entityType, 'block'));
}