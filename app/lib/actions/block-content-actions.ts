import { eq, and } from 'drizzle-orm';
import { blockContents } from '../db/schema';
import { ArtifactContent, ArtifactFormSubmission } from '../definitions/definitions';
import { v4 as uuid } from 'uuid';

export async function handleContentsUpdate(
  tx: any,
  accountId: string,
  blockId: string,
  contents: ArtifactFormSubmission['contents']
): Promise<void> {
  for (const content of contents) {
    if (content.id) {
      await updateContent(tx, accountId, blockId, content);
    } else {
      await insertContent(tx, accountId, blockId, content);
    }
  }
}

export async function insertContent(
  tx: any,
  accountId: string,
  blockId: string,
  content: ArtifactFormSubmission['contents'][0]
): Promise<void> {
  await tx.insert(blockContents).values({
    id: uuid(),
    accountId,
    blockId,
    type: content.type,
    content: content.content,
    metadata: content.metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateContent(
  tx: any,
  accountId: string,
  blockId: string,
  content: ArtifactFormSubmission['contents'][0]
): Promise<void> {
  await tx.update(blockContents)
    .set({
      type: content.type,
      content: content.content,
      metadata: content.metadata,
      updatedAt: new Date(),
    })
    .where(and(
      eq(blockContents.id, content.id),
      eq(blockContents.accountId, accountId),
      eq(blockContents.blockId, blockId)
    ));
}

export async function deleteAllContents(
  tx: any,
  accountId: string,
  blockId: string
): Promise<void> {
  await tx.delete(blockContents)
    .where(and(
      eq(blockContents.blockId, blockId),
      eq(blockContents.accountId, accountId)
    ));
}