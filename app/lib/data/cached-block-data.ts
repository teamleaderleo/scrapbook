import { cache } from 'react'
import { fetchAllArtifacts } from './block-data'
import { ADMIN_UUID } from '../constants'
import { ArtifactWithRelations } from "../definitions/definitions";
import { ArtifactFetchOptions } from '../definitions/definitions';

export const getCachedArtifacts = cache(async (accountId: string): Promise<ArtifactWithRelations[]> => {
  const blocks = await fetchAllArtifacts(accountId);
  return blocks;
});
