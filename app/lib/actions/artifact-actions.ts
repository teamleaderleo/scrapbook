'use server';

import { z } from 'zod';
import { db } from '../db/db.server';
import { revalidatePath } from 'next/cache';
import { suggestTags } from '../external/claude-utils';
import { handleArtifactUpdateWithinTransaction, handleArtifactDeleteWithinTransaction, handleArtifactCreateWithinTransaction } from './artifact-handlers';
import { hasValidContent } from './artifact-content-actions';

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
      const { deleted } = await handleArtifactUpdateWithinTransaction(tx, accountId, id, name, description, tags || [], projects || [], formData);

      if (deleted) {
        return { message: 'Artifact deleted successfully (all content removed).', success: true };
      }

      const suggestedTags = await suggestTags(`${name} ${description}`);
      return { message: 'Artifact updated successfully', suggestedTags, success: true };
    });

    revalidatePath('/dashboard/artifacts');
    return result;
  } catch (error) {
    console.error('Error updating artifact:', error);
    return { message: 'Database Error: Failed to Update Artifact.', success: false };
  }
}

export async function deleteArtifact(id: string, accountId: string): Promise<State> {
  try {
    await db.transaction(async (tx) => {
      await handleArtifactDeleteWithinTransaction(tx, accountId, id);
    });

    revalidatePath('/dashboard/artifacts');
    return { message: 'Artifact deleted successfully.', success: true };
  } catch (error) {
    console.error('Error deleting artifact:', error);
    return { message: 'Failed to delete artifact.', success: false };
  }
}

export async function createArtifact(accountId: string, formData: FormData): Promise<State> {
  const validatedFields = ArtifactSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    tags: formData.getAll('tags'),
    projects: formData.getAll('projects'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Artifact.',
    };
  }

  const { name, description, tags, projects } = validatedFields.data;

  if (!hasValidContent(formData)) {
    return { message: 'Error: Artifact must have at least one content item.', success: false };
  }
  
  try {
    return await db.transaction(async (tx) => {
      const newArtifactId = await handleArtifactCreateWithinTransaction(tx, accountId, name, description, tags || [], projects || [], formData);

      const suggestedTags = await suggestTags(`${name} ${description || ''}`);

      return { message: 'Artifact created successfully', suggestedTags, artifactId: newArtifactId, success: true };
    });
  } catch (error: any) {
    console.error('Error creating artifact:', error);
    return { message: `Error: Failed to Create Artifact. ${error.message}`, success: false };
  }
}