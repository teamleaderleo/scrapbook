'use server';

import { eq, and } from 'drizzle-orm';
import { artifacts, artifactContents, artifactTags, projectArtifactLinks } from '../db/schema';
import { handleContentUpdate, hasValidContent, insertContents } from './artifact-content-actions';
import { handleTagUpdateWithinTransaction } from './tag-handlers';
import { handleProjectUpdateWithinTransaction } from './project-handlers';
import { deleteRemovedContents } from './artifact-content-actions';
import { v4 as uuid } from 'uuid';

export async function handleArtifactUpdateWithinTransaction(
  tx: any,
  accountId: string,
  artifactId: string,
  name: string,
  description: string | undefined,
  tags: string[],
  projects: string[],
  formData: FormData
): Promise<{ deleted: boolean }> {
  const { shouldDelete, newContentCount } = await handleContentUpdate(accountId, artifactId, formData);

  if (shouldDelete) {
    await handleArtifactDeleteWithinTransaction(tx, accountId, artifactId);
    return { deleted: true };
  }

  await tx.update(artifacts)
    .set({ name, description, updatedAt: new Date() })
    .where(and(
      eq(artifacts.id, artifactId),
      eq(artifacts.accountId, accountId)
    ));

  await handleTagUpdateWithinTransaction(tx, accountId, artifactId, tags, false);
  await handleProjectUpdateWithinTransaction(tx, accountId, artifactId, projects);

  return { deleted: false };
}

export async function handleArtifactDeleteWithinTransaction(
  tx: any,
  accountId: string,
  artifactId: string
): Promise<void> {
  // Delete associated tags and project links
  await tx.delete(artifactTags).where(and(eq(artifactTags.artifactId, artifactId), eq(artifactTags.accountId, accountId)));
  await tx.delete(projectArtifactLinks).where(and(eq(projectArtifactLinks.artifactId, artifactId), eq(projectArtifactLinks.accountId, accountId)));
  
  // Fetch all contents associated with this artifact
  const contents = await tx.select().from(artifactContents)
    .where(and(eq(artifactContents.artifactId, artifactId), eq(artifactContents.accountId, accountId)));

  // Delete all associated files and content records
  deleteRemovedContents(accountId, contents, new Set(contents.map((content: { id: any; }) => content.id)));

  // Finally, delete the artifact itself
  await tx.delete(artifacts).where(and(eq(artifacts.id, artifactId), eq(artifacts.accountId, accountId)));
}

export async function handleArtifactCreateWithinTransaction(
  tx: any,
  accountId: string,
  name: string,
  description: string | undefined,
  tags: string[],
  projects: string[],
  formData: FormData
): Promise<string> {
  const newArtifactId = uuid();
  const now = new Date();

  try {
    await tx.insert(artifacts).values({ 
      id: newArtifactId,
      accountId, 
      name, 
      description, 
      createdAt: now, 
      updatedAt: now 
    });

    await insertContents(tx, accountId, newArtifactId, formData);

    if (tags.length > 0) {
      await handleTagUpdateWithinTransaction(tx, accountId, newArtifactId, tags, false);
    }

    if (projects.length > 0) {
      await handleProjectUpdateWithinTransaction(tx, accountId, newArtifactId, projects);
    }

    return newArtifactId;
  } catch (error) {
    // If an error occurs, the transaction will be automatically rolled back
    // The cleanup of S3 resources is handled within insertContents
    throw error;
  }
}