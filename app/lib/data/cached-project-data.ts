import { cache } from 'react'
import { fetchAllProjects } from './project-data'
import { ProjectWithRelations } from '../definitions';
import { FetchOptions } from '../definitions';

export const getCachedProjects = cache(async (accountId: string, options: FetchOptions): Promise<ProjectWithRelations[]> => {
  const projects = await fetchAllProjects(accountId, options);
  return projects;
});