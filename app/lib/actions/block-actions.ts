'use server';

import { db } from '../db/db';
import { and, eq } from 'drizzle-orm';
import { blocks, projectBlockLinks, tagAssociations } from '../db/schema';
import { v4 as uuid } from 'uuid';
import { JSONContent } from '@tiptap/react';


export type BlockState = {
  errors?: {
    content?: string[];
  };
  message?: string | null;
  blockId?: string;
  success: boolean;
};

export async function updateBlock(id: string, accountId: string, data: JSONContent): Promise<BlockState> {
  try {
    await db.update(blocks)
      .set({ content: data, updatedAt: new Date() })
      .where(and(
        eq(blocks.id, id),
        eq(blocks.accountId, accountId)
      ));

    return { message: 'Block updated successfully', success: true };
  } catch (error: any) {
    console.error('Error updating block:', error);
    return { message: `Failed to update block: ${error.message}`, success: false };
  }
}

export async function deleteBlock(id: string, accountId: string): Promise<BlockState> {
  try {
    await db.transaction(async (tx) => {

      await tx.delete(tagAssociations)
        .where(and(
          eq(tagAssociations.associatedId, id),
          eq(tagAssociations.entityType, 'block'),
          eq(tagAssociations.accountId, accountId)
        ));

      await tx.delete(projectBlockLinks)
        .where(and(
          eq(projectBlockLinks.blockId, id),
          eq(projectBlockLinks.accountId, accountId)
        ));

      await tx.delete(blocks)
        .where(and(
          eq(blocks.id, id),
          eq(blocks.accountId, accountId)
        ));
    });

    return { message: 'Block deleted successfully', success: true };
  } catch (error: any) {
    console.error('Error deleting block:', error);
    return { message: `Failed to delete block: ${error.message}`, success: false };
  }
}

export async function createBlock(accountId: string,  data: JSONContent): Promise<BlockState> {
  try {
    const newBlockId = uuid();
    const now = new Date();
    
    const [newBlock] = await db.insert(blocks).values({
      id: newBlockId,
      accountId,
      content: data,
      createdAt: now,
      updatedAt: now
    }).returning();

    return { message: 'Block created successfully', blockId: newBlock.id, success: true };
  } catch (error: any) {
    console.error('Error creating block:', error);
    return { message: `Failed to create block: ${error.message}`, success: false };
  }
}