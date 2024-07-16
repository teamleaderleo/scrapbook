import { eq, and, inArray, not } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projects, projectTags, projectArtifactLinks } from '../db/schema';
import { handleTagUpdateWithinTransaction } from './tag-handlers';
import { BaseProject, Tag } from '../definitions';
import { v4 as uuid } from 'uuid';

export async function handleProjectUpdateWithinTransaction(
  tx: any,
  accountId: string,
  artifactId: string,
  projectIds: string[]
): Promise<void> {
  // Remove existing project links that are not in the new projectIds list
  await tx.delete(projectArtifactLinks)
    .where(and(
      eq(projectArtifactLinks.accountId, accountId),
      eq(projectArtifactLinks.artifactId, artifactId),
      not(inArray(projectArtifactLinks.projectId, projectIds))
    ));

  // Add new project links
  for (const projectId of projectIds) {
    await tx.insert(projectArtifactLinks)
      .values({
        id: uuid(),
        accountId,
        artifactId,
        projectId,
        addedAt: new Date()
      })
      .onConflictDoNothing({
        target: [projectArtifactLinks.accountId, projectArtifactLinks.artifactId, projectArtifactLinks.projectId]
      });
  }
}

// For standalone use
export async function handleProjectUpdate(
  accountId: string,
  artifactId: string,
  projectIds: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    await handleProjectUpdateWithinTransaction(tx, accountId, artifactId, projectIds);
  });
}

export async function handleProjectTagsUpdate(
  accountId: string,
  projectId: string,
  tags: Tag[]
): Promise<void> {
  await db.transaction(async (tx) => {
    await handleTagUpdateWithinTransaction(tx, accountId, projectId, tags.map(tag => tag.name), true);
  });
}

export async function handleProjectArtifactsUpdate(
  accountId: string,
  projectId: string,
  artifactIds: string[]
): Promise<void> {
  await db.transaction(async (tx) => {
    // Remove existing artifact links
    await tx.delete(projectArtifactLinks)
      .where(and(
        eq(projectArtifactLinks.projectId, projectId),
        eq(projectArtifactLinks.accountId, accountId)
      ));

    // Add new artifact links
    for (const artifactId of artifactIds) {
      await tx.insert(projectArtifactLinks).values({
        accountId,
        projectId,
        artifactId,
        addedAt: new Date()
      });
    }
  });
}