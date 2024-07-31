'use server';

import { eq, and } from 'drizzle-orm';
import { blocks, tagAssociations, projectBlockLinks } from '../db/schema';
import { handleContentsUpdate, deleteAllContents } from './block-content-actions';
import { handleTagUpdateWithinTransaction } from './tag-handlers';
import { handleProjectUpdateWithinTransaction } from './project-handlers';
import { v4 as uuid } from 'uuid';
import { BlockFormSubmission } from '../definitions/definitions';

export async function handleBlockUpdateWithinTransaction(
  tx: any,
  accountId: string,
  blockId: string,
  data: BlockFormSubmission
): Promise<void> {
  const { name, description, tags, projects, contents } = data;

  // Update block main data
  await tx.update(blocks)
    .set({ name, description, updatedAt: new Date() })
    .where(and(
      eq(blocks.id, blockId),
      eq(blocks.accountId, accountId)
    ));

  // Handle contents
  await handleContentsUpdate(tx, accountId, blockId, contents);

  // Update tags and projects
  await handleTagUpdateWithinTransaction(tx, accountId, blockId, 'block', tags);
  await handleProjectUpdateWithinTransaction(tx, accountId, blockId, projects);
}

export async function handleBlockDeleteWithinTransaction(
  tx: any,
  accountId: string,
  blockId: string
): Promise<void> {
  // Delete associated tags and project links
  await tx.delete(tagAssociations).where(and(eq(tagAssociations.associatedId, blockId), eq(tagAssociations.accountId, accountId)));
  await tx.delete(projectBlockLinks).where(and(eq(projectBlockLinks.blockId, blockId), eq(projectBlockLinks.accountId, accountId)));
  
  // Delete all associated content records
  await deleteAllContents(tx, accountId, blockId);

  // Finally, delete the block itself
  await tx.delete(blocks).where(and(eq(blocks.id, blockId), eq(blocks.accountId, accountId)));
}

export async function handleBlockCreateWithinTransaction(
  tx: any,
  accountId: string,
  data: BlockFormSubmission
): Promise<string> {
  const { name, description, tags, projects, contents } = data;
  const newBlockId = uuid();
  const now = new Date();

  await tx.insert(blocks).values({ 
    id: newBlockId,
    accountId, 
    name, 
    description, 
    createdAt: now, 
    updatedAt: now 
  });

  await handleContentsUpdate(tx, accountId, newBlockId, contents);

  await handleTagUpdateWithinTransaction(tx, accountId, newBlockId, 'block', tags);
  await handleProjectUpdateWithinTransaction(tx, accountId, newBlockId, projects);

  return newBlockId;
}