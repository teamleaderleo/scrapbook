import { cache } from 'react'
import { fetchAllProjects, fetchProjectsBasic } from './project-data'
import { ProjectFetchOptions } from '../definitions/definitions';
import { BaseProject, ProjectWithTags, ProjectWithArtifacts, ProjectWithExtendedArtifacts, ProjectPreview, ProjectWithArtifactsViewRow } from "../definitions/definitions";

export const getCachedProjectBasics = cache(async (accountId: string): Promise<BaseProject[]> => {
  return fetchProjectsBasic(accountId);
});

export const getCachedProjects = cache(async (
  accountId: string, 
): Promise< ProjectWithArtifactsViewRow[] > => {
  return fetchAllProjects(accountId);
});