'use server';

import { eq, and } from 'drizzle-orm';
import { artifacts, artifactContents, tagAssociations, projectArtifactLinks } from '../db/schema';
import { deleteContent, insertContents, updateContent } from './artifact-content-actions';
import { handleTagUpdateWithinTransaction } from './tag-handlers';
import { handleProjectUpdateWithinTransaction } from './project-handlers';
import { v4 as uuid } from 'uuid';
import { ArtifactFormSubmission } from '../definitions/definitions';

export async function handleArtifactUpdateWithinTransaction(
  tx: any,
  accountId: string,
  artifactId: string,
  data: ArtifactFormSubmission
): Promise<void> {
  const { name, description, tags, projects, contents } = data;

  // Update artifact main data
  await tx.update(artifacts)
    .set({ name, description, updatedAt: new Date() })
    .where(and(
      eq(artifacts.id, artifactId),
      eq(artifacts.accountId, accountId)
    ));

  // Update existing contents or insert new ones
  for (const content of contents) {
    if (content.id) {
      await updateContent(tx, accountId, artifactId, content);
    } else {
      await insertContents(tx, accountId, artifactId, [content]);
    }
  }

  // Update tags and projects
  await handleTagUpdateWithinTransaction(tx, accountId, artifactId, 'artifact', tags);
  await handleProjectUpdateWithinTransaction(tx, accountId, artifactId, projects);
}

export async function handleArtifactDeleteWithinTransaction(
  tx: any,
  accountId: string,
  artifactId: string,
  contents: ArtifactFormSubmission['contents']
): Promise<void> {
  // Delete associated tags and project links
  await tx.delete(tagAssociations).where(and(eq(tagAssociations.associatedId, artifactId), eq(tagAssociations.accountId, accountId)));
  await tx.delete(projectArtifactLinks).where(and(eq(projectArtifactLinks.artifactId, artifactId), eq(projectArtifactLinks.accountId, accountId)));
  
  // Delete all associated content records
  for (const content of contents) {
    await deleteContent(tx, accountId, artifactId, content.id);
  }

  // Finally, delete the artifact itself
  await tx.delete(artifacts).where(and(eq(artifacts.id, artifactId), eq(artifacts.accountId, accountId)));
}

export async function handleArtifactCreateWithinTransaction(
  tx: any,
  accountId: string,
  data: ArtifactFormSubmission
): Promise<string> {
  const { name, description, tags, projects, contents } = data;
  const newArtifactId = uuid();
  const now = new Date();

  await tx.insert(artifacts).values({ 
    id: newArtifactId,
    accountId, 
    name, 
    description, 
    createdAt: now, 
    updatedAt: now 
  });

  for (const content of contents) {
    await tx.insert(artifactContents).values({
      id: content.id,
      accountId,
      artifactId: newArtifactId,
      type: content.type,
      content: content.content,
      metadata: content.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  await handleTagUpdateWithinTransaction(tx, accountId, newArtifactId, 'artifact', tags);
  await handleProjectUpdateWithinTransaction(tx, accountId, newArtifactId, projects);

  return newArtifactId;
}