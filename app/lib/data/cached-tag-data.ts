import { cache } from 'react'
import { fetchAllTags } from './tag-data'
import { Tag } from '../definitions';

export const getCachedTags = cache(async (accountId: string): Promise<Tag[]> => {
  const tags = await fetchAllTags(accountId);
  return tags;
});