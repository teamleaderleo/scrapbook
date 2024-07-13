import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projectArtifactLinks } from '../db/schema';

export async function handleProjectUpdate(tx: any, accountId: string, artifactId: string, projectIds: string[]): Promise<void> {
  // Remove existing project links
  await tx.delete(projectArtifactLinks)
    .where(and(
      eq(projectArtifactLinks.accountId, accountId),
      eq(projectArtifactLinks.artifactId, artifactId)
    ));

  // Add new project links
  for (const projectId of projectIds) {
    await tx.insert(projectArtifactLinks).values({
      accountId,
      artifactId,
      projectId,
      addedAt: new Date()
    });
  }
}