import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Fuse from 'fuse.js';
import { Tag } from '@/app/lib/definitions';
import { createTag, updateTag, deleteTag } from '@/app/lib/actions/tag-actions';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedTags, getCachedTagUsage } from '../data/cached-tag-data';
import { useKeyNav } from './useKeyNav';

const ITEMS_PER_PAGE = 20;

export function useTags() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: tags = [], isLoading, error } = useQuery<Tag[], Error>(
    ['tags'],
    () => getCachedTags(ADMIN_UUID),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const fuse = useMemo(() => {
    if (!tags) return null;
    return new Fuse(tags, {
      keys: ['name'],
      threshold: 0.3,
    });
  }, [tags]);

  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!query) return tags;
    return fuse ? fuse.search(query).map(result => result.item) : tags;
  }, [tags, query, fuse]);

  const totalPages = Math.ceil(filteredTags.length / ITEMS_PER_PAGE);

  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTags.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTags, currentPage]);

  const addTagMutation = useMutation(
    (name: string) => createTag(ADMIN_UUID, name),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tags']);
      },
    }
  );

  const updateTagMutation = useMutation(
    ({ tagId, newName }: { tagId: string; newName: string }) => updateTag(ADMIN_UUID, tagId, newName),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tags']);
      },
    }
  );

  const deleteTagMutation = useMutation(
    (tagId: string) => deleteTag(ADMIN_UUID, tagId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tags']);
      },
    }
  );

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  useKeyNav(currentPage, totalPages, handlePageChange, true);

  const addTag = useCallback(async (name: string): Promise<Tag> => {
    const trimmedName = name.trim().toLowerCase();
    const existingTag = tags.find(tag => tag.name.toLowerCase() === trimmedName);
    if (existingTag) return existingTag;

    const newTag = await addTagMutation.mutateAsync(trimmedName);
    return newTag;
  }, [tags, addTagMutation]);

  const getOrCreateTags = useCallback(async (tagNames: string[]): Promise<Tag[]> => {
    const result: Tag[] = [];
    for (const name of tagNames) {
      const tag = await addTag(name);
      result.push(tag);
    }
    return result;
  }, [addTag]);

  const tagNamesToTags = useCallback((tagNames: string[]) => {
    return tags.filter(tag => tagNames.includes(tag.name));
  }, [tags]);

  const tagsToTagNames = useCallback((tags: Tag[]) => {
    return tags.map(tag => tag.name);
  }, []);

  const useTagUsage = (tagId: string) => {
    return useQuery(['tagUsage', tagId], () => getCachedTagUsage(ADMIN_UUID, tagId), {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    });
  };

  return {
    tags,
    tagNames: tags.map(tag => tag.name),
    filteredTags,
    paginatedTags,
    isLoading,
    error,
    query,
    currentPage,
    totalPages,
    handleSearch,
    handlePageChange,
    addTag,
    updateTag: updateTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    getOrCreateTags,
    tagNamesToTags,
    tagsToTagNames,
    useTagUsage,
  };
}