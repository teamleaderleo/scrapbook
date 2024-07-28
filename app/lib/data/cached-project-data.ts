import { cache } from 'react'
import { fetchAllProjects, fetchProjectBasics, fetchProjectPreviews } from './project-data'
import { ProjectWithArtifacts, ProjectFetchOptions, ProjectBasic, ProjectPreview } from '../definitions';

export const getCachedProjects = cache(async (accountId: string, options: ProjectFetchOptions): Promise<ProjectWithArtifacts[]> => {
  const projects = await fetchAllProjects(accountId, options);
  return projects.filter((project): project is ProjectWithArtifacts => 'artifacts' in project);
});

export const getCachedProjectBasics = cache(async (accountId: string): Promise<ProjectBasic[]> => {
  const projects = await fetchProjectBasics(accountId);
  return projects.map(project => ({
    ...project,
    status: project.status as "pending" | "completed"
  }));
});

export const getCachedProjectPreviews = cache(async (projectIds: string[]): Promise<ProjectPreview[]> => {
  const projectPreviews = await fetchProjectPreviews(projectIds);
  return projectPreviews.map(projectPreview => ({
    ...projectPreview,
    description: projectPreview.description ?? undefined,
    status: projectPreview.status as "pending" | "completed",
    previewArtifact: projectPreview.previewArtifact ? {
      id: projectPreview.previewArtifact.id ?? null,
      name: projectPreview.previewArtifact.name ?? null,
      previewContent: projectPreview.previewArtifact.previewContent ?? null
    } : null
  }));
});