'use server';

import { sql } from '@vercel/postgres';
import { Tag } from './definitions/definitions';
import { signIn } from '@/auth';

export async function addTagToProject(accountId: string, projectId: string, tagName: string): Promise<Tag | null> {
  try {
    const result = await sql`
      WITH tag_upsert AS (
        INSERT INTO tag (account_id, name)
        VALUES (${accountId}, ${tagName})
        ON CONFLICT (account_id, name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name
      )
      INSERT INTO project_tag (account_id, project_id, tag_id)
      SELECT ${accountId}, ${projectId}, id FROM tag_upsert
      ON CONFLICT (account_id, project_id, tag_id) DO NOTHING
      RETURNING (SELECT json_build_object('id', id, 'name', name) FROM tag_upsert);
    `;
    
    return result.rows[0]?.json_build_object as Tag | null;
  } catch (error) {
    console.error('Error adding tag to project:', error);
    throw error;
  }
}

export async function removeTagFromProject(accountId: string, projectId: string, tagId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM project_tag
      WHERE account_id = ${accountId} AND project_id = ${projectId} AND tag_id = ${tagId};
    `;
  } catch (error) {
    console.error('Error removing tag from project:', error);
    throw error;
  }
}

export async function getProjectTags(accountId: string, projectId: string): Promise<Tag[]> {
  try {
    const result = await sql`
      SELECT t.id, t.name
      FROM tag t
      JOIN project_tag pt ON t.id = pt.tag_id
      WHERE t.account_id = ${accountId} AND pt.project_id = ${projectId};
    `;
    return result.rows as Tag[];
  } catch (error) {
    console.error('Error getting project tags:', error);
    throw error;
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if ((error as Error).message.includes('CredentialsSignin')) {
      return 'CredentialSignin';
    }
    throw error;
  }
}
