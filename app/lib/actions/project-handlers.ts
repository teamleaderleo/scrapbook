import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projectArtifactLinks } from '../db/schema';

export async function handleProjectUpdateWithinTransaction(tx: any, accountId: string, artifactId: string, projectIds: string[]): Promise<void> {
  for (const projectId of projectIds) {
    await tx.insert(projectArtifactLinks).values({
      accountId,
      artifactId,
      projectId,
      addedAt: new Date()
    });
  }
}

// For standalone use
export async function handleProjectUpdate(
  accountId: string,
  itemId: string,
  newTags: string[],
  isProject: boolean = false
): Promise<void> {
  await db.transaction(async (tx) => {
    await updateTagsCore(tx, accountId, itemId, newTags, isProject);
  });
}