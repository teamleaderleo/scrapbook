import { cache } from 'react'
import { fetchAllArtifacts } from './artifact-data'
import { ADMIN_UUID } from '../constants'
import { ArtifactWithRelations } from '../definitions';
import { FetchOptions } from '../definitions';

export const getCachedArtifacts = cache(async (accountId: string, options: FetchOptions ): Promise<ArtifactWithRelations[]> => {
  const artifacts = await fetchAllArtifacts(accountId, options);
  return artifacts;
});
