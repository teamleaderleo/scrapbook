'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addTagToArtifact, removeTagFromArtifact, getArtifactTags } from './utils-server';
import { ContentType } from './definitions';
import { uploadToS3, deleteFromS3 } from './s3-operations';

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

async function handleContentUpdate(accountId: string, artifactId: string, formData: FormData) {
  const existingContents = await sql`
    SELECT id, type, content FROM artifact_content
    WHERE artifact_id = ${artifactId} AND account_id = ${accountId}
  `;

  const existingContentIds = new Set(existingContents.rows.map(row => row.id));

  let index = 0;
  while (formData.get(`contentType-${index}`) !== null) {
    const contentType = formData.get(`contentType-${index}`) as ContentType;
    const contentItem = formData.get(`content-${index}`);
    const contentIdValue = formData.get(`contentId-${index}`);
    const contentId = typeof contentIdValue === 'string' ? contentIdValue : null;

    let content: string;
    if (contentType === 'text') {
      content = contentItem as string;
    } else if (contentItem instanceof File) {
      content = await uploadToS3(contentItem, contentType, accountId);
    } else if (typeof contentItem === 'string' && contentItem.startsWith('data:')) {
      // Handle base64 encoded file
      const base64Data = contentItem.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      content = await uploadToS3(buffer, contentType, accountId);
    } else if (contentId) {
      // Existing file, no change
      content = existingContents.rows.find(row => row.id === contentId)?.content || '';
    } else {
      throw new Error(`Invalid content for type ${contentType}`);
    }

    if (contentId) {
      // Update existing content
      await sql`
        UPDATE artifact_content
        SET type = ${contentType}, content = ${content}
        WHERE id = ${contentId} AND account_id = ${accountId}
      `;
      existingContentIds.delete(contentId);
    } else {
      // Insert new content
      await sql`
        INSERT INTO artifact_content (account_id, artifact_id, type, content)
        VALUES (${accountId}, ${artifactId}, ${contentType}, ${content})
      `;
    }

    index++;
  }

  // Delete removed contents
  for (const contentId of existingContentIds) {
    const contentToDelete = existingContents.rows.find(row => row.id === contentId);
    if (contentToDelete && (contentToDelete.type === 'image' || contentToDelete.type === 'file')) {
      await deleteFromS3(contentToDelete.content);
    }
    await sql`DELETE FROM artifact_content WHERE id = ${contentId} AND account_id = ${accountId}`;
  }
}

async function handleTagUpdate(accountId: string, artifactId: string, newTags: string[]) {
  const currentTags = await getArtifactTags(accountId, artifactId);

  for (const tag of currentTags) {
    if (!newTags.includes(tag.name)) {
      await removeTagFromArtifact(accountId, artifactId, tag.id);
    }
  }

  for (const tagName of newTags) {
    if (!currentTags.some(tag => tag.name === tagName)) {
      await addTagToArtifact(accountId, artifactId, tagName);
    }
  }
}

async function handleProjectUpdate(accountId: string, artifactId: string, projects: string[]) {
  await sql`DELETE FROM project_artifact_link WHERE artifact_id = ${artifactId} AND account_id = ${accountId}`;
  if (projects && projects.length > 0) {
    for (const projectId of projects) {
      await sql`
        INSERT INTO project_artifact_link (account_id, project_id, artifact_id)
        VALUES (${accountId}, ${projectId}, ${artifactId})
      `;
    }
  }
}

export async function updateArtifact(id: string, accountId: string, prevState: State, formData: FormData) {
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
    await sql`BEGIN`;

    await sql`
      UPDATE artifact
      SET name = ${name}, description = ${description}
      WHERE id = ${id} AND account_id = ${accountId}
    `;

    await handleContentUpdate(accountId, id, formData);
    await handleTagUpdate(accountId, id, tags || []);
    await handleProjectUpdate(accountId, id, projects || []);

    await sql`COMMIT`;

    revalidatePath('/dashboard/artifacts');
    redirect('/dashboard/artifacts');
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Error updating artifact:', error);
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
    const contents = await sql`
      SELECT id, type, content FROM artifact_content
      WHERE artifact_id = ${id} AND account_id = ${accountId}
    `;

    for (const content of contents.rows) {
      if (content.type === 'image' || content.type === 'file') {
        await deleteFromS3(content.content);
      }
    }

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

export async function createArtifact(accountId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const tags = formData.getAll('tags') as string[];
  const description = formData.get('description') as string;
  const projects = formData.getAll('projects') as string[];

  // Check if there's at least one content item
  let hasContent = false;
  let index = 0;
  while (formData.get(`contentType-${index}`)) {
    const contentItem = formData.get(`content-${index}`);
    if (contentItem && (typeof contentItem === 'string' ? contentItem.trim() !== '' : true)) {
      hasContent = true;
      break;
    }
    index++;
  }

  if (!hasContent) {
    return {
      message: 'Error: Artifact must have at least one content item.',
    };
  }
  
  try {
    await sql`BEGIN`;

    const result = await sql`
      INSERT INTO artifact (account_id, name, description)
      VALUES (${accountId}, ${name}, ${description})
      RETURNING id
    `;
    const artifactId = result.rows[0].id;

    // Handle multiple content items
    let index = 0;
    while (formData.get(`contentType-${index}`)) {
      const contentType = formData.get(`contentType-${index}`) as ContentType;
      const contentItem = formData.get(`content-${index}`);

      let content: string;
      if (contentType === 'text') {
        content = contentItem as string;
      } else if (contentItem instanceof File) {
        content = await uploadToS3(contentItem, contentType, accountId);
      } else {
        throw new Error(`Invalid content for type ${contentType}`);
      }

      await sql`
        INSERT INTO artifact_content (account_id, artifact_id, type, content)
        VALUES (${accountId}, ${artifactId}, ${contentType}, ${content})
      `;

      index++;
    }

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
      message: `Error: Failed to Create Artifact. ${error.message}`,
    };
  }
}
