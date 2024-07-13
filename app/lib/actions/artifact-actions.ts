'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.server';
import { revalidatePath } from 'next/cache';
import { suggestTags } from '../external/claude-utils';
import { artifacts, artifactContents, artifactTags, projectArtifactLinks } from '../db/schema';
import { handleContentUpdate, hasValidContent, insertContents } from './artifact-content-actions';
import { handleTagUpdate } from './tag-actions';
import { handleProjectUpdate } from './project-handlers';
import { deleteFromS3 } from '../external/s3-operations';
import { v4 as uuid } from 'uuid';

const ArtifactSchema = z.object({
  name: z.string().min(1, 'Artifact name is required.'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
});

export type State = {
  errors?: {
    name?: string[];
    description?: string[];
    type?: string[];
    content?: string[];
    tags?: string[];
    projects?: string[];
  };
  message?: string | null;
  suggestedTags?: string[];
  artifactId?: string;
  success?: boolean;
};

export async function updateArtifact(id: string, accountId: string, prevState: State, formData: FormData): Promise<State> {
  const validatedFields = ArtifactSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    tags: formData.getAll('tags'),
    projects: formData.getAll('projects'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Artifact.',
    };
  }

  const { name, description, tags, projects } = validatedFields.data;

  try {
    const result = await db.transaction(async (tx) => {
      await tx.update(artifacts)
        .set({ name, description, updatedAt: new Date() })
        .where(and(
          eq(artifacts.id, id),
          eq(artifacts.accountId, accountId)
        ));

      const hasContent = await handleContentUpdate(accountId, id, formData);

      if (!hasContent) {
        await deleteArtifact(id, accountId);
        return { message: 'Artifact deleted due to lack of content' };
      }

      const contents = await tx.select({ content: artifactContents.content })
        .from(artifactContents)
        .where(and(
          eq(artifactContents.artifactId, id),
          eq(artifactContents.accountId, accountId),
          eq(artifactContents.type, 'text')
        ));

      const allContent = contents.map(row => row.content).join(' ');

      const suggestedTags = await suggestTags(`${name} ${description} ${allContent}`);

      await handleTagUpdate(tx, accountId, id, tags || []);
      await handleProjectUpdate(tx, accountId, id, projects || []);

      return { message: 'Artifact updated successfully', suggestedTags };
    });

    revalidatePath('/dashboard/artifacts');
    return result;
  } catch (error) {
    console.error('Error updating artifact:', error);
    return { message: 'Database Error: Failed to Update Artifact.' };
  }
}

export async function deleteArtifact(id: string, accountId: string): Promise<State> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(artifactTags).where(and(eq(artifactTags.artifactId, id), eq(artifactTags.accountId, accountId)));
      await tx.delete(projectArtifactLinks).where(and(eq(projectArtifactLinks.artifactId, id), eq(projectArtifactLinks.accountId, accountId)));
      
      const contents = await tx.select().from(artifactContents)
        .where(and(eq(artifactContents.artifactId, id), eq(artifactContents.accountId, accountId)));

      for (const content of contents) {
        if (content.type === 'image' || content.type === 'file') {
          await deleteFromS3(content.content);
        }
      }

      await tx.delete(artifactContents).where(and(eq(artifactContents.artifactId, id), eq(artifactContents.accountId, accountId)));
      await tx.delete(artifacts).where(and(eq(artifacts.id, id), eq(artifacts.accountId, accountId)));
    });

    revalidatePath('/dashboard/artifacts');
    return { message: 'Artifact deleted successfully.', success: true };
  } catch (error) {
    console.error('Error deleting artifact:', error);
    return { message: 'Failed to delete artifact.', success: false };
  }
}

export async function createArtifact(accountId: string, formData: FormData): Promise<State> {
  const name = formData.get('name') as string;
  const tags = formData.getAll('tags') as string[];
  const description = formData.get('description') as string | undefined;
  const projects = formData.getAll('projects') as string[];

  if (!hasValidContent(formData)) {
    return { message: 'Error: Artifact must have at least one content item.', success: false };
  }
  
  try {
    return await db.transaction(async (tx) => {
      const newArtifactId = uuid();
      const now = new Date();

      // Create the artifact first
      await tx.insert(artifacts).values({ 
        id: newArtifactId,
        accountId, 
        name, 
        description, 
        createdAt: now, 
        updatedAt: now 
      });

      // Insert contents
      const allContent = await insertContents(tx, accountId, newArtifactId, formData);

      // Handle tags
      if (tags && tags.length > 0) {
        await handleTagUpdate(tx, accountId, newArtifactId, tags, false);
      }

      // Handle projects
      if (projects && projects.length > 0) {
        await handleProjectUpdate(tx, accountId, newArtifactId, projects);
      }

      const suggestedTags = await suggestTags(`${name} ${description || ''} ${allContent.trim()}`);

      return { message: 'Artifact created successfully', suggestedTags, artifactId: newArtifactId, success: true };
    });
  } catch (error: any) {
    console.error('Error creating artifact:', error);
    return { message: `Error: Failed to Create Artifact. ${error.message}`, success: false };
  }
}