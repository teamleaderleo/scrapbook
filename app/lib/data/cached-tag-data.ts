import { cache } from 'react'
import { fetchAllTags, fetchTagUsage } from './tag-data'
import { Tag } from '../definitions';

export const getCachedTags = cache(async (accountId: string): Promise<Tag[]> => {
  const tags = await fetchAllTags(accountId);
  return tags;
});

export const getCachedTagUsage = cache(async (accountId: string, tagId: string): Promise<{ projectCount: number; artifactCount: number }> => {
  const usage = await fetchTagUsage(accountId, tagId);
  return usage;
});