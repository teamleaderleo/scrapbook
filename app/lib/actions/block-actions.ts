'use server';

import { db } from '../db/db';
import { revalidatePath } from 'next/cache';
import { suggestTags } from '../external/claude-utils';
import { handleArtifactUpdateWithinTransaction, handleArtifactDeleteWithinTransaction, handleArtifactCreateWithinTransaction } from './block-handlers';
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
  blockId?: string;
  success?: boolean;
};

export async function updateArtifact(id: string, accountId: string, data: ArtifactFormSubmission): Promise<State> {
  try {
    await db.transaction(async (tx) => {
      await handleArtifactUpdateWithinTransaction(tx, accountId, id, data);
    });

    revalidatePath('/dashboard/blocks');
    return { message: 'Artifact updated successfully.', success: true };
  } catch (error) {
    console.error('Error updating block:', error);
    return { message: 'Database Error: Failed to Update Artifact.', success: false };
  }
}

export async function deleteArtifact(id: string, accountId: string, data: ArtifactFormSubmission): Promise<State> {
  try {
    await db.transaction(async (tx) => {
      await handleArtifactDeleteWithinTransaction(tx, accountId, id);
    });

    revalidatePath('/dashboard/blocks');
    return { message: 'Artifact deleted successfully.', success: true };
  } catch (error) {
    console.error('Error deleting block:', error);
    return { message: 'Failed to delete block.', success: false };
  }
}

export async function createArtifact(accountId: string, data: ArtifactFormSubmission): Promise<State> {
  try {
    return await db.transaction(async (tx) => {
      const newArtifactId = await handleArtifactCreateWithinTransaction(tx, accountId, data);
      return { message: 'Artifact created successfully', blockId: newArtifactId, success: true };
    });
  } catch (error: any) {
    console.error('Error creating block:', error);
    return { message: `Error: Failed to Create Artifact. ${error.message}`, success: false };
  }
}