'use server';

import { eq, and } from 'drizzle-orm';
import { blocks, tagAssociations, projectArtifactLinks } from '../db/schema';
import { handleContentsUpdate, deleteAllContents } from './block-content-actions';
import { handleTagUpdateWithinTransaction } from './tag-handlers';
import { handleProjectUpdateWithinTransaction } from './project-handlers';
import { v4 as uuid } from 'uuid';
import { ArtifactFormSubmission } from '../definitions/definitions';

export async function handleArtifactUpdateWithinTransaction(
  tx: any,
  accountId: string,
  blockId: string,
  data: ArtifactFormSubmission
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

export async function handleArtifactDeleteWithinTransaction(
  tx: any,
  accountId: string,
  blockId: string
): Promise<void> {
  // Delete associated tags and project links
  await tx.delete(tagAssociations).where(and(eq(tagAssociations.associatedId, blockId), eq(tagAssociations.accountId, accountId)));
  await tx.delete(projectArtifactLinks).where(and(eq(projectArtifactLinks.blockId, blockId), eq(projectArtifactLinks.accountId, accountId)));
  
  // Delete all associated content records
  await deleteAllContents(tx, accountId, blockId);

  // Finally, delete the block itself
  await tx.delete(blocks).where(and(eq(blocks.id, blockId), eq(blocks.accountId, accountId)));
}

export async function handleArtifactCreateWithinTransaction(
  tx: any,
  accountId: string,
  data: ArtifactFormSubmission
): Promise<string> {
  const { name, description, tags, projects, contents } = data;
  const newArtifactId = uuid();
  const now = new Date();

  await tx.insert(blocks).values({ 
    id: newArtifactId,
    accountId, 
    name, 
    description, 
    createdAt: now, 
    updatedAt: now 
  });

  await handleContentsUpdate(tx, accountId, newArtifactId, contents);

  await handleTagUpdateWithinTransaction(tx, accountId, newArtifactId, 'block', tags);
  await handleProjectUpdateWithinTransaction(tx, accountId, newArtifactId, projects);

  return newArtifactId;
}