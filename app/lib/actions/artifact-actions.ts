'use server';

import { db } from '../db/db';
import { revalidatePath } from 'next/cache';
import { suggestTags } from '../external/claude-utils';
import { handleArtifactUpdateWithinTransaction, handleArtifactDeleteWithinTransaction, handleArtifactCreateWithinTransaction } from './artifact-handlers';
import { ArtifactFormSubmission, ArtifactFormSubmissionSchema } from '../definitions/definitions';

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

export async function updateArtifact(id: string, accountId: string, data: ArtifactFormSubmission): Promise<State> {
  const { name, description, tags, projects, contents } = data;

  try {
    const result = await db.transaction(async (tx) => {
      const { deleted } = await handleArtifactUpdateWithinTransaction(tx, accountId, id, name, description, tags, projects, contents);
      if (deleted) {
        return { message: 'Artifact deleted successfully (all content removed).', success: true };
      }
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
  // Validation can be done here if needed
  const { name, description, tags, projects, contents } = data;

  try {
    return await db.transaction(async (tx) => {
      const newArtifactId = await handleArtifactCreateWithinTransaction(tx, accountId, name, description, tags, projects, contents);
      return { message: 'Artifact created successfully', artifactId: newArtifactId, success: true };
    });
  } catch (error: any) {
    console.error('Error creating artifact:', error);
    return { message: `Error: Failed to Create Artifact. ${error.message}`, success: false };
  }
}