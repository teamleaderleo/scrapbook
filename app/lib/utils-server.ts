'use server';

import { sql } from '@vercel/postgres';
import { Tag } from './definitions';

export async function addTagToProject(accountId: string, projectId: string, tagName: string): Promise<Tag | null> {
  try {
    const result = await sql`
      INSERT INTO tag (account_id, name, project_id)
      VALUES (${accountId}, ${tagName}, ${projectId})
      ON CONFLICT (account_id, name, project_id) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `;
    
    return result.rows[0] as Tag;
  } catch (error) {
    console.error('Error adding tag to project:', error);
    throw error;
  }
}

export async function removeTagFromProject(accountId: string, projectId: string, tagId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM tag
      WHERE account_id = ${accountId} AND project_id = ${projectId} AND id = ${tagId}
    `;
  } catch (error) {
    console.error('Error removing tag from project:', error);
    throw error;
  }
}

export async function getProjectTags(accountId: string, projectId: string): Promise<Tag[]> {
  try {
    const result = await sql`
      SELECT id, name
      FROM tag
      WHERE account_id = ${accountId} AND project_id = ${projectId}
    `;
    return result.rows as Tag[];
  } catch (error) {
    console.error('Error getting project tags:', error);
    throw error;
  }
}

export async function addTagToArtifact(accountId: string, artifactId: string, tagName: string): Promise<Tag | null> {
  try {
    const result = await sql`
      INSERT INTO tag (account_id, name, artifact_id)
      VALUES (${accountId}, ${tagName}, ${artifactId})
      ON CONFLICT (account_id, name, artifact_id) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `;
    
    return result.rows[0] as Tag;
  } catch (error) {
    console.error('Error adding tag to artifact:', error);
    throw error;
  }
}

export async function removeTagFromArtifact(accountId: string, artifactId: string, tagId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM tag
      WHERE account_id = ${accountId} AND artifact_id = ${artifactId} AND id = ${tagId}
    `;
  } catch (error) {
    console.error('Error removing tag from artifact:', error);
    throw error;
  }
}

export async function getArtifactTags(accountId: string, artifactId: string): Promise<Tag[]> {
  try {
    const result = await sql`
      SELECT id, name
      FROM tag
      WHERE account_id = ${accountId} AND artifact_id = ${artifactId}
    `;
    return result.rows as Tag[];
  } catch (error) {
    console.error('Error getting artifact tags:', error);
    throw error;
  }
}