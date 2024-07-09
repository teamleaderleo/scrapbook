'use server';
 
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addTagToProject, removeTagFromProject, getProjectTags } from './utils-server';

const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed'], {
    invalid_type_error: 'Please select a project status.',
  }),
  tags: z.array(z.string()).optional(),
  artifacts: z.array(z.string()).optional(),
});

export type State = {
  errors?: {
    name?: string[];
    description?: string[];
    status?: string[];
    tags?: string[];
    artifacts?: string[];
  };
  message?: string | null;
};

export async function createProject(accountId: string, prevState: State, formData: FormData) {
  console.log('Starting createProject function');
  console.log('Account ID:', accountId);
  console.log('Form data:', Object.fromEntries(formData));

  const validatedFields = ProjectSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    status: formData.get('status'),
    tags: formData.getAll('tags'),
    artifacts: formData.getAll('artifacts'),
  });

  if (!validatedFields.success) {
    console.log('Validation failed:', validatedFields.error);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Project.',
    };
  }

  const { name, description, status, tags, artifacts } = validatedFields.data;
  console.log('Validated data:', { name, description, status, tags, artifacts });

  try {
    // Start a transaction
    await sql`BEGIN`;

    console.log('Attempting to insert new project');
    const result = await sql`
      INSERT INTO project (account_id, name, description, status)
      VALUES (${accountId}, ${name}, ${description}, ${status})
      RETURNING id
    `;
    const projectId = result.rows[0].id;
    console.log('Project inserted, ID:', projectId);

    if (tags && tags.length > 0) {
      console.log('Inserting tags:', tags);
      for (const tagName of tags) {
        await addTagToProject(accountId, projectId, tagName);
      }
    }

    if (artifacts && artifacts.length > 0) {
      console.log('Linking artifacts:', artifacts);
      for (const artifactId of artifacts) {
        await sql`
          INSERT INTO project_artifact_link (account_id, project_id, artifact_id)
          VALUES (${accountId}, ${projectId}, ${artifactId})
        `;
      }
    }

    // Commit the transaction
    await sql`COMMIT`;

    console.log('Project creation completed successfully');
    revalidatePath('/dashboard/projects');
    return { message: 'Project created successfully' };
  } catch (error: any) {
    // Rollback the transaction in case of error
    await sql`ROLLBACK`;
    console.error('Error in createProject:', error);
    return {
      message: `Database Error: Failed to Create Project. ${error.message}`,
    };
  }
}

export async function updateProject(id: string, accountId: string, prevState: State, formData: FormData) {
  const validatedFields = ProjectSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    status: formData.get('status'),
    tags: formData.getAll('tags'),
    artifacts: formData.getAll('artifacts'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Project.',
    };
  }

  const { name, description, status, tags, artifacts } = validatedFields.data;

  try {
    await sql`
      UPDATE project
      SET name = ${name}, description = ${description}, status = ${status}
      WHERE id = ${id} AND account_id = ${accountId}
    `;

    // Update tags
    const currentTags = await getProjectTags(accountId, id);
    const newTags = tags as string[];

    // Remove tags that are no longer associated with the project
    for (const tag of currentTags) {
      if (!newTags.includes(tag.name)) {
        await removeTagFromProject(accountId, id, tag.id);
      }
    }

    // Add new tags
    for (const tagName of newTags) {
      if (!currentTags.some(tag => tag.name === tagName)) {
        await addTagToProject(accountId, id, tagName);
      }
    }

    // Update artifacts
    await sql`DELETE FROM project_artifact_link WHERE project_id = ${id}`;
    if (artifacts && artifacts.length > 0) {
      for (const artifactId of artifacts) {
        await sql`
          INSERT INTO project_artifact_link (account_id, project_id, artifact_id)
          VALUES (${accountId}, ${id}, ${artifactId})
        `;
      }
    }

  } catch (error) {
    console.error('Error updating project:', error);
    return { message: 'Database Error: Failed to Update Project.' };
  }
 
  revalidatePath('/dashboard/projects');
  redirect('/dashboard/projects');
}

export async function deleteProject(id: string, accountId: string) {
  try {
    // Start a transaction
    await sql`BEGIN`;

    // Delete associated project-tag links
    await sql`DELETE FROM project_tag WHERE project_id = ${id}`;
    
    // Delete associated project-artifact links
    await sql`DELETE FROM project_artifact_link WHERE project_id = ${id} AND account_id = ${accountId}`;

    // Delete the project
    await sql`DELETE FROM project WHERE id = ${id} AND account_id = ${accountId}`;

    // Commit the transaction
    await sql`COMMIT`;

    revalidatePath('/dashboard/projects');
    return { success: true, message: 'Project deleted successfully.' };
  } catch (error) {
    // Rollback the transaction in case of error
    await sql`ROLLBACK`;
    console.error('Error deleting project:', error);
    return { success: false, message: 'Database Error: Failed to delete project.' };
  }
}