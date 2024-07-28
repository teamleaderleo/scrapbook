import { cache } from 'react'
import { fetchAllProjects } from './project-data'
import { ProjectWithArtifacts } from '../definitions';
import { FetchOptions } from '../definitions';

export const getCachedProjects = cache(async (accountId: string, options: FetchOptions): Promise<ProjectWithArtifacts[]> => {
  const projects = await fetchAllProjects(accountId, options);
  return projects.filter((project): project is ProjectWithArtifacts => 'artifacts' in project);
});