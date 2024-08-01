'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import { revalidatePath } from 'next/cache';
import { suggestTags } from '../external/claude-utils';
import { projects, projectBlockLinks, tagAssociations } from '../db/schema';
import { handleTagUpdateWithinTransaction } from './tag-handlers';
import { v4 as uuid } from 'uuid';
import { ProjectFormSubmission, ProjectFormSubmissionSchema } from '../definitions/definitions';

const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed'], {
    invalid_type_error: 'Please select a project status.',
  }),
  tags: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
});

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

  const { name, description, status, tags, blocks } = validatedFields.data;

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
        status,
        createdAt: now,
        updatedAt: now
      });

      // Handle tags
      if (tags && tags.length > 0) {
        await handleTagUpdateWithinTransaction(tx, accountId, newProjectId, 'project', tags);
      }

      // Handle blocks
      if (blocks && blocks.length > 0) {
        for (const blockId of blocks) {
          await tx.insert(projectBlockLinks).values({
            accountId,
            projectId: newProjectId,
            blockId,
            addedAt: now
          });
        }
      }

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

  const { name, description, status, tags, blocks } = validatedFields.data;

  try {
    const result = await db.transaction(async (tx) => {
      await tx.update(projects)
        .set({ name, description, status, updatedAt: new Date() })
        .where(and(
          eq(projects.id, id),
          eq(projects.accountId, accountId)
        ));

      // Handle tags
      if (tags) {
        await handleTagUpdateWithinTransaction(tx, accountId, id, 'project', tags);
      }

      // Handle blocks
      await tx.delete(projectBlockLinks)
        .where(and(
          eq(projectBlockLinks.projectId, id),
          eq(projectBlockLinks.accountId, accountId)
        ));

      if (blocks && blocks.length > 0) {
        for (const blockId of blocks) {
          await tx.insert(projectBlockLinks).values({
            accountId,
            projectId: id,
            blockId,
            addedAt: new Date()
          });
        }
      }

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
      await tx.delete(tagAssociations).where(and(eq(tagAssociations.associatedId, id), eq(tagAssociations.accountId, accountId)));
      await tx.delete(projectBlockLinks).where(and(eq(projectBlockLinks.projectId, id), eq(projectBlockLinks.accountId, accountId)));
      await tx.delete(projects).where(and(eq(projects.id, id), eq(projects.accountId, accountId)));
    });

    revalidatePath('/dashboard/projects');
    return { message: 'Project deleted successfully.', success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { message: 'Failed to delete project.', success: false };
  }
}