import { cache } from 'react'
import { fetchAllProjects, fetchAllProjectsWithBlocksWithTags, fetchProjectsBasic } from './project-data'
import { ProjectFetchOptions, ProjectWithBlocksWithTags } from '../definitions/definitions';
import { BaseProject, ProjectWithTags, ProjectWithBlocks, ProjectWithExtendedBlocks, ProjectPreview } from "../definitions/definitions";

export const getCachedProjectBasics = cache(async (accountId: string): Promise<BaseProject[]> => {
  return fetchProjectsBasic(accountId);
});

export const getCachedProjects = cache(async (
  accountId: string, 
): Promise< ProjectWithBlocks[] > => {
  return fetchAllProjects(accountId);
});

export const getCachedProjectsWithBlocksWithTags = cache(async (
  accountId: string, 
): Promise<ProjectWithBlocksWithTags[]> => {
  return fetchAllProjectsWithBlocksWithTags(accountId);
});