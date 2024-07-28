import { cache } from 'react'
import { fetchAllProjects, fetchProjectSkeletons, fetchProjectPreviews } from './project-data'
import { ProjectWithArtifacts, ProjectFetchOptions } from '../definitions';

export const getCachedProjects = cache(async (accountId: string, options: ProjectFetchOptions): Promise<ProjectWithArtifacts[]> => {
  const projects = await fetchAllProjects(accountId, options);
  return projects.filter((project): project is ProjectWithArtifacts => 'artifacts' in project);
});

// export const getCachedProjectSkeletons = cache(async (accountId: string): Promise<ProjectSkeleton[]> => {
//   return fetchProjectSkeletons(accountId);
// });

// export const getCachedProjectPreviews = cache(async (projectId: string): Promise<ProjectPreview> => {
//   return fetchProjectPreviews(projectId);
// });