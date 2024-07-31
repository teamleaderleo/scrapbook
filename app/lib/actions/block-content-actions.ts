import { eq, and } from 'drizzle-orm';
import { artifactContents } from '../db/schema';
import { ArtifactContent, ArtifactFormSubmission } from '../definitions/definitions';
import { v4 as uuid } from 'uuid';

export async function handleContentsUpdate(
  tx: any,
  accountId: string,
  artifactId: string,
  contents: ArtifactFormSubmission['contents']
): Promise<void> {
  for (const content of contents) {
    if (content.id) {
      await updateContent(tx, accountId, artifactId, content);
    } else {
      await insertContent(tx, accountId, artifactId, content);
    }
  }
}

export async function insertContent(
  tx: any,
  accountId: string,
  artifactId: string,
  content: ArtifactFormSubmission['contents'][0]
): Promise<void> {
  await tx.insert(artifactContents).values({
    id: uuid(),
    accountId,
    artifactId,
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
  artifactId: string,
  content: ArtifactFormSubmission['contents'][0]
): Promise<void> {
  await tx.update(artifactContents)
    .set({
      type: content.type,
      content: content.content,
      metadata: content.metadata,
      updatedAt: new Date(),
    })
    .where(and(
      eq(artifactContents.id, content.id),
      eq(artifactContents.accountId, accountId),
      eq(artifactContents.artifactId, artifactId)
    ));
}

export async function deleteAllContents(
  tx: any,
  accountId: string,
  artifactId: string
): Promise<void> {
  await tx.delete(artifactContents)
    .where(and(
      eq(artifactContents.artifactId, artifactId),
      eq(artifactContents.accountId, accountId)
    ));
}