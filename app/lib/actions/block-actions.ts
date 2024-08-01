'use server';

import { db } from '../db/db';
import { revalidatePath } from 'next/cache';
import { BlockFormSubmission } from '../definitions/definitions';

export type State = {
  errors?: {
    content?: string[];
    tags?: string[];
    projects?: string[];
  };
  message?: string | null;
  blockId?: string;
  success?: boolean;
};

export async function updateBlock(id: string, accountId: string, data: BlockFormSubmission): Promise<State> {
  try {
    await db.transaction(async (tx) => {
      await handleBlockUpdateWithinTransaction(tx, accountId, id, data);
    });

    revalidatePath('/dashboard/blocks');
    return { message: 'Block updated successfully.', success: true };
  } catch (error) {
    console.error('Error updating block:', error);
    return { message: 'Database Error: Failed to Update Block.', success: false };
  }
}

export async function deleteBlock(id: string, accountId: string): Promise<State> {
  try {
    await db.transaction(async (tx) => {
      await handleBlockDeleteWithinTransaction(tx, accountId, id);
    });

    revalidatePath('/dashboard/blocks');
    return { message: 'Block deleted successfully.', success: true };
  } catch (error) {
    console.error('Error deleting block:', error);
    return { message: 'Failed to delete block.', success: false };
  }
}

export async function createBlock(accountId: string, data: BlockFormSubmission): Promise<State> {
  try {
    return await db.transaction(async (tx) => {
      const newBlockId = await handleBlockCreateWithinTransaction(tx, accountId, data);
      return { message: 'Block created successfully', blockId: newBlockId, success: true };
    });
  } catch (error: any) {
    console.error('Error creating block:', error);
    return { message: `Error: Failed to Create Block. ${error.message}`, success: false };
  }
}