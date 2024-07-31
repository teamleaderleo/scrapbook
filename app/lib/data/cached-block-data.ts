import { cache } from 'react'
import { fetchAllBlocks } from './block-data'
import { ADMIN_UUID } from '../constants'
import { BlockWithRelations } from "../definitions/definitions";
import { BlockFetchOptions } from '../definitions/definitions';

export const getCachedBlocks = cache(async (accountId: string): Promise<BlockWithRelations[]> => {
  const blocks = await fetchAllBlocks(accountId);
  return blocks;
});
