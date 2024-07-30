import { eq, and } from 'drizzle-orm';
import { artifactContents } from '../db/schema';
import { ArtifactContent, ArtifactFormSubmission } from '../definitions/definitions';
import { v4 as uuid } from 'uuid';

export async function insertContents(
  tx: any,
  accountId: string,
  artifactId: string,
  contents: ArtifactFormSubmission['contents']
): Promise<void> {
  for (const content of contents) {
    await tx.insert(artifactContents).values({
      id: content.id,
      accountId,
      artifactId,
      type: content.type,
      content: content.content,
      metadata: content.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
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

export async function deleteContent(
  tx: any,
  accountId: string,
  artifactId: string,
  contentId: string
): Promise<void> {
  await tx.delete(artifactContents)
    .where(and(
      eq(artifactContents.id, contentId),
      eq(artifactContents.accountId, accountId),
      eq(artifactContents.artifactId, artifactId)
    ));
}