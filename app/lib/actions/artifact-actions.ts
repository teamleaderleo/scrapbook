'use server';

import { z } from 'zod';
import { db } from '../db/db';
import { revalidatePath } from 'next/cache';
import { suggestTags } from '../external/claude-utils';
import { handleArtifactUpdateWithinTransaction, handleArtifactDeleteWithinTransaction, handleArtifactCreateWithinTransaction } from './artifact-handlers';
import { hasValidContent } from './artifact-content-actions';
import { ArtifactFormSubmission } from '../definitions/definitions';

export const ArtifactFormSubmissionSchema = z.object({
  name: z.string().min(1, 'Artifact name is required.'),
  description: z.string().optional(),
  tags: z.array(z.string()),
  projects: z.array(z.string()),
  contents: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(['text', 'image', 'file', 'link']),
    content: z.union([z.string(), z.instanceof(Blob)]),
    metadata: z.record(z.unknown()),
  })),
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

export async function updateArtifact(id: string, accountId: string, prevState: State,  data: ArtifactFormSubmission): Promise<State> {
  const validatedFields = ArtifactFormSubmissionSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your input.',
    };
  }

  const { name, description, tags, projects } = validatedFields.data;

  try {
    const result = await db.transaction(async (tx) => {
      const { deleted } = await handleArtifactUpdateWithinTransaction(tx, accountId, id, name, description, tags || [], projects || [], data);

      if (deleted) {
        return { message: 'Artifact deleted successfully (all content removed).', success: true };
      }

      // const suggestedTags = await suggestTags(`${name} ${description}`);
      return { message: 'Artifact updated successfully', success: true };
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

export async function createArtifact(accountId: string, data: ArtifactFormSubmission): Promise<State> {
  const validatedFields = ArtifactFormSubmissionSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your input.',
    };
  }

  const { name, description, tags, projects, contents } = validatedFields.data;

  if (!hasValidContent(data)) {
    return { message: 'Error: Artifact must have at least one content item.', success: false };
  }
  
  try {
    return await db.transaction(async (tx) => {
      const newArtifactId = await handleArtifactCreateWithinTransaction(tx, accountId, name, description, tags || [], projects || [], data);

      // const suggestedTags = await suggestTags(`${name} ${description || ''}`);

      return { message: 'Artifact created successfully', artifactId: newArtifactId, success: true };
    });
  } catch (error: any) {
    console.error('Error creating artifact:', error);
    return { message: `Error: Failed to Create Artifact. ${error.message}`, success: false };
  }
}
