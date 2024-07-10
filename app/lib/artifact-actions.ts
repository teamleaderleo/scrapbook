'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addTagToArtifact, removeTagFromArtifact, getArtifactTags } from './utils-server';
import { ContentType } from './definitions';

const ArtifactSchema = z.object({
  name: z.string().min(1, 'Artifact name is required.'),
  description: z.string().optional(),
  type: z.enum(['text', 'image', 'file'] as const, {
    invalid_type_error: 'Please select a valid artifact type.',
  }),
  content: z.string().min(1, 'Artifact content is required.'),
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
};

export async function updateArtifact(id: string, accountId: string, prevState: State, formData: FormData) {
  const validatedFields = ArtifactSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    type: formData.get('type'),
    content: formData.get('content'),
    tags: formData.getAll('tags'),
    projects: formData.getAll('projects'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Artifact.',
    };
  }

  const { name, description, type, content, tags, projects } = validatedFields.data;

  try {
    await sql`BEGIN`;

    await sql`
      UPDATE artifact
      SET name = ${name}, description = ${description}, type = ${type}
      WHERE id = ${id} AND account_id = ${accountId}
    `;

    await sql`
      INSERT INTO artifact_content (account_id, artifact_id, type, content)
      VALUES (${accountId}, ${id}, ${type}, ${content})
    `;

    // Update tags
    const currentTags = await getArtifactTags(accountId, id);
    const newTags = tags || [];

    for (const tag of currentTags) {
      if (!newTags.includes(tag.name)) {
        await removeTagFromArtifact(accountId, id, tag.id);
      }
    }

    for (const tagName of newTags) {
      if (!currentTags.some(tag => tag.name === tagName)) {
        await addTagToArtifact(accountId, id, tagName);
      }
    }

    // Update project associations
    await sql`DELETE FROM project_artifact_link WHERE artifact_id = ${id} AND account_id = ${accountId}`;
    if (projects && projects.length > 0) {
      for (const projectId of projects) {
        await sql`
          INSERT INTO project_artifact_link (account_id, project_id, artifact_id)
          VALUES (${accountId}, ${projectId}, ${id})
        `;
      }
    }

    await sql`COMMIT`;

    revalidatePath('/dashboard/artifacts');
    redirect('/dashboard/artifacts');
  } catch (error) {
    await sql`ROLLBACK`;
    return { message: 'Database Error: Failed to Update Artifact.' };
  }
}

export async function deleteArtifact(id: string, accountId: string) {
  try {
    await sql`BEGIN`;

    // Delete associated artifact-tag links
    await sql`DELETE FROM artifact_tag WHERE artifact_id = ${id}`;
    
    // Delete associated project-artifact links
    await sql`DELETE FROM project_artifact_link WHERE artifact_id = ${id} AND account_id = ${accountId}`;

    // Delete artifact content
    await sql`DELETE FROM artifact_content WHERE artifact_id = ${id} AND account_id = ${accountId}`;

    // Delete the artifact
    await sql`DELETE FROM artifact WHERE id = ${id} AND account_id = ${accountId}`;

    await sql`COMMIT`;

    revalidatePath('/dashboard/artifacts');
    return { success: true, message: 'Artifact deleted successfully.' };
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Error deleting artifact:', error);
    return { success: false, message: 'Database Error: Failed to delete artifact.' };
  }
}

export async function createArtifact(accountId: string, prevState: State, formData: FormData) {
  const validatedFields = ArtifactSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    type: formData.get('type'),
    content: formData.get('content'),
    tags: formData.getAll('tags'),
    projects: formData.getAll('projects'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Artifact.',
    };
  }

  const { name, description, type, content, tags, projects } = validatedFields.data;

  try {
    await sql`BEGIN`;

    const result = await sql`
      INSERT INTO artifact (account_id, name, description, type)
      VALUES (${accountId}, ${name}, ${description}, ${type})
      RETURNING id
    `;
    const artifactId = result.rows[0].id;

    await sql`
      INSERT INTO artifact_content (account_id, artifact_id, type, content)
      VALUES (${accountId}, ${artifactId}, ${type}, ${content})
    `;

    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        await addTagToArtifact(accountId, artifactId, tagName);
      }
    }

    if (projects && projects.length > 0) {
      for (const projectId of projects) {
        await sql`
          INSERT INTO project_artifact_link (account_id, project_id, artifact_id)
          VALUES (${accountId}, ${projectId}, ${artifactId})
        `;
      }
    }

    await sql`COMMIT`;

    revalidatePath('/dashboard/artifacts');
    return { message: 'Artifact created successfully' };
  } catch (error: any) {
    await sql`ROLLBACK`;
    return {
      message: `Database Error: Failed to Create Artifact. ${error.message}`,
    };
  }
}