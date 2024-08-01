'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import { projectBlockLinks } from '../db/schema';
// import { handleTagUpdateWithinTransaction } from './tag-handlers';
import { Tag } from '../definitions/definitions';
import { v4 as uuid } from 'uuid';

export async function handleProjectUpdateWithinTransaction(
  tx: any,
  accountId: string,
  blockId: string,
  projectIds: string[]
): Promise<void> {
  // Add new project links
  for (const projectId of projectIds) {
    await tx.insert(projectBlockLinks)
      .values({
        id: uuid(),
        accountId,
        blockId,
        projectId,
        addedAt: new Date()
      })
      .onConflictDoNothing({
        target: [projectBlockLinks.accountId, projectBlockLinks.blockId, projectBlockLinks.projectId]
      });
  }
}

export async function handleProjectUpdate(
  accountId: string,
  blockId: string,
  projectIds: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    await handleProjectUpdateWithinTransaction(tx, accountId, blockId, projectIds);
  });
}

export async function handleProjectBlocksUpdate(
  accountId: string,
  projectId: string,
  blockIds: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const blockId of blockIds) {
      await tx.insert(projectBlockLinks).values({
        accountId,
        projectId,
        blockId,
        addedAt: new Date()
      })
      .onConflictDoNothing({
        target: [projectBlockLinks.accountId, projectBlockLinks.projectId, projectBlockLinks.blockId]
      });
    }
  });
}