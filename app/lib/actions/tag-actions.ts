import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import { tags, tagAssociations } from '../db/schema';
import { Tag } from '../definitions/definitions';

export type TagState = {
  message?: string | null;
  tag?: Tag;
  success: boolean;
};

export async function createTag(name: string, accountId: string, tx: any = db): Promise<TagState> {
  try {
    const [newTag] = await tx.insert(tags)
      .values({ name, accountId })
      .returning();
    return { tag: newTag, success: true };
  } catch (error: any) {
    console.error('Error creating tag:', error);
    return { message: `Failed to create tag: ${error.message}`, success: false };
  }
}

export async function updateTag(tagId: string, name: string, tx: any = db): Promise<TagState> {
  try {
    const [updatedTag] = await tx.update(tags)
      .set({ name })
      .where(eq(tags.id, tagId))
      .returning();
    return { tag: updatedTag, success: true };
  } catch (error: any) {
    console.error('Error updating tag:', error);
    return { message: `Failed to update tag: ${error.message}`, success: false };
  }
}

export async function deleteTag(tagId: string, tx: any = db): Promise<TagState> {
  try {
    await tx.delete(tagAssociations)
      .where(eq(tagAssociations.tagId, tagId));
    await tx.delete(tags)
      .where(eq(tags.id, tagId));
    
    return { message: 'Tag deleted successfully', success: true };
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    return { message: `Failed to delete tag: ${error.message}`, success: false };
  }
}

async function associateTag(tagId: string, entityId: string, entityType: 'project' | 'block', accountId: string, tx: any = db): Promise<TagState> {
  try {
    await tx.insert(tagAssociations)
      .values({ tagId, associatedId: entityId, entityType, accountId })
      .onConflictDoNothing();
    return { message: 'Tag associated successfully', success: true };
  } catch (error: any) {
    console.error('Error associating tag:', error);
    return { message: `Failed to associate tag: ${error.message}`, success: false };
  }
}

// Tag association operations
export async function associateTagWithProject(tagId: string, projectId: string, accountId: string, tx: any = db): Promise<TagState> {
  return associateTag(tagId, projectId, 'project', accountId, tx);
}

export async function associateTagWithBlock(tagId: string, blockId: string, accountId: string, tx: any = db): Promise<TagState> {
  return associateTag(tagId, blockId, 'block', accountId, tx);
}

async function disassociateTag(tagId: string, entityId: string, entityType: 'project' | 'block', tx: any = db): Promise<TagState> {
  try {
    await tx.delete(tagAssociations)
      .where(and(
        eq(tagAssociations.tagId, tagId),
        eq(tagAssociations.associatedId, entityId),
        eq(tagAssociations.entityType, entityType)
      ));
    return { message: 'Tag disassociated successfully', success: true };
  } catch (error: any) {
    console.error('Error disassociating tag:', error);
    return { message: `Failed to disassociate tag: ${error.message}`, success: false };
  }
}

export async function disassociateTagFromProject(tagId: string, projectId: string, tx: any = db): Promise<TagState> {
  return disassociateTag(tagId, projectId, 'project', tx);
}

export async function disassociateTagFromBlock(tagId: string, blockId: string, tx: any = db): Promise<TagState> {
  return disassociateTag(tagId, blockId, 'block', tx);
}

async function getTagsForEntity(entityId: string, entityType: 'project' | 'block', tx: any = db): Promise<Tag[]> {
  return tx.select({ id: tags.id, name: tags.name, accountId: tags.accountId })
    .from(tags)
    .innerJoin(tagAssociations, eq(tags.id, tagAssociations.tagId))
    .where(and(
      eq(tagAssociations.associatedId, entityId),
      eq(tagAssociations.entityType, entityType)
    ));
}

export async function getTagsForProject(projectId: string, tx: any = db): Promise<Tag[]> {
  return getTagsForEntity(projectId, 'project', tx);
}

export async function getTagsForBlock(blockId: string, tx: any = db): Promise<Tag[]> {
  return getTagsForEntity(blockId, 'block', tx);
}