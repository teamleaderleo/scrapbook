import { cache } from 'react'
import { fetchAllTags, fetchTagUsage } from './tag-data'
import { Tag } from '../definitions/definitions';

export const getCachedTags = cache(async (accountId: string): Promise<Tag[]> => {
  try {
    const tags = await fetchAllTags(accountId);
    return Array.isArray(tags) ? tags : [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
});

export const getCachedTagUsage = cache(async (accountId: string, tagId: string): Promise<{ [key: string]: number }> => {
  return await fetchTagUsage(accountId, tagId);
});