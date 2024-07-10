'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { Tag } from './definitions';

export async function createTag(accountId: string, name: string) {
  try {
    const result = await sql`
      INSERT INTO tag (account_id, name)
      VALUES (${accountId}, ${name})
      RETURNING id, name
    `;
    revalidatePath('/dashboard/tags');
    return result.rows[0] as Tag;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

export async function updateTag(accountId: string, tagId: string, newName: string) {
  try {
    const result = await sql`
      UPDATE tag
      SET name = ${newName}
      WHERE id = ${tagId} AND account_id = ${accountId}
      RETURNING id, name
    `;
    revalidatePath('/dashboard/tags');
    return result.rows[0] as Tag;
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
}

export async function deleteTag(accountId: string, tagId: string) {
  try {
    await sql`BEGIN`;
    
    // Remove tag from projects
    await sql`DELETE FROM project_tag WHERE tag_id = ${tagId} AND account_id = ${accountId}`;
    
    // Remove tag from artifacts
    await sql`DELETE FROM artifact_tag WHERE tag_id = ${tagId} AND account_id = ${accountId}`;
    
    // Delete the tag
    await sql`DELETE FROM tag WHERE id = ${tagId} AND account_id = ${accountId}`;
    
    await sql`COMMIT`;
    
    revalidatePath('/dashboard/tags');
    return { success: true, message: 'Tag deleted successfully.' };
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Error deleting tag:', error);
    throw error;
  }
}

export async function getTagUsage(accountId: string, tagId: string) {
  try {
    const result = await sql`
      SELECT
        (SELECT COUNT(*) FROM project_tag WHERE tag_id = ${tagId} AND account_id = ${accountId}) as project_count,
        (SELECT COUNT(*) FROM artifact_tag WHERE tag_id = ${tagId} AND account_id = ${accountId}) as artifact_count
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error getting tag usage:', error);
    throw error;
  }
}