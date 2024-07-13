import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.server';
import { projectArtifactLinks } from '../db/schema';

export async function handleProjectUpdate(accountId: string, artifactId: string, projects: string[]): Promise<void> {
  await db.delete(projectArtifactLinks)
    .where(and(
      eq(projectArtifactLinks.artifactId, artifactId),
      eq(projectArtifactLinks.accountId, accountId)
    ));

  if (projects && projects.length > 0) {
    await db.insert(projectArtifactLinks)
      .values(projects.map(projectId => ({
        accountId,
        projectId,
        artifactId,
        addedAt: new Date()
      })));
  }
}