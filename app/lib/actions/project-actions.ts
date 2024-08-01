'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import { revalidatePath } from 'next/cache';
import { projects, projectBlockLinks, tagAssociations } from '../db/schema';
import { v4 as uuid } from 'uuid';
import { ProjectFormSubmission, ProjectFormSubmissionSchema } from '../definitions/definitions';

export type State = {
  errors?: {
    name?: string[];
    description?: string[];
    status?: string[];
    tags?: string[];
    blocks?: string[];
  };
  message?: string | null;
  suggestedTags?: string[];
  projectId?: string;
  success?: boolean;
};

export async function createProject(accountId: string, data: ProjectFormSubmission): Promise<State> {
  const validatedFields = ProjectFormSubmissionSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Project.',
    };
  }

  const { name, description, status, } = validatedFields.data;

  try {
    return await db.transaction(async (tx) => {
      const newProjectId = uuid();
      const now = new Date();

      // Create the project
      await tx.insert(projects).values({
        id: newProjectId,
        accountId,
        name,
        description,
        createdAt: now,
        updatedAt: now
      });

      return { message: 'Project created successfully', projectId: newProjectId, success: true };
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return { message: `Error: Failed to Create Project. ${error.message}`, success: false };
  }
}

export async function updateProject(id: string, accountId: string, formData: ProjectFormSubmission): Promise<State> {
  const validatedFields = ProjectFormSubmissionSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Project.',
    };
  }

  const { name, description } = validatedFields.data;

  try {
    const result = await db.transaction(async (tx) => {
      await tx.update(projects)
        .set({ name, description, updatedAt: new Date() })
        .where(and(
          eq(projects.id, id),
          eq(projects.accountId, accountId)
        ));
      return { message: 'Project updated successfully' };
    });

    revalidatePath('/dashboard/projects');
    return result;
  } catch (error) {
    console.error('Error updating project:', error);
    return { message: 'Database Error: Failed to Update Project.' };
  }
}

export async function deleteProject(id: string, accountId: string): Promise<State> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(projects).where(and(eq(projects.id, id), eq(projects.accountId, accountId)));
    });

    revalidatePath('/dashboard/projects');
    return { message: 'Project deleted successfully.', success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { message: 'Failed to delete project.', success: false };
  }
}