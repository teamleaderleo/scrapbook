import { cache } from 'react'
import { fetchAllArtifacts } from './artifact-data'
import { ADMIN_UUID } from '../constants'
import { ArtifactWithRelations } from '../definitions';

export const getCachedArtifacts = cache(async (): Promise<ArtifactWithRelations[]> => {
  const artifacts = await fetchAllArtifacts(ADMIN_UUID, { includeContents: true, includeTags: true, includeProjects: true });
  return artifacts;
});

