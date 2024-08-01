import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { Tag } from '@/app/lib/definitions/definitions';
import { createTag, updateTag, deleteTag } from '@/app/lib/actions/tag-actions';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedTags, getCachedTagUsage } from '../data/cached-tag-data';
import { useKeyNav } from './useKeyNav';

const ITEMS_PER_PAGE = 20;

export function useTags() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: tags = [], isLoading, error } = useQuery<Tag[], Error>({
    queryKey: ['tags'],
    queryFn: () => getCachedTags(ADMIN_UUID),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const fuse = useMemo(() => {
    if (!tags.length) return null;
    return new Fuse(tags, {
      keys: ['name'],
      threshold: 0.3,
    });
  }, [tags]);

  const filteredTags = useMemo(() => {
    if (!tags.length) return [];
    if (!query) return tags;
    return fuse ? fuse.search(query).map(result => result.item) : tags;
  }, [tags, query, fuse]);

  const totalPages = Math.max(1, Math.ceil(filteredTags.length / ITEMS_PER_PAGE));

  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTags.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTags, currentPage]);

  const addTagMutation = useMutation({
    mutationFn: (name: string) => createTag(ADMIN_UUID, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, newName }: { tagId: string; newName: string }) => updateTag(ADMIN_UUID, tagId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(ADMIN_UUID, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  useKeyNav(currentPage, totalPages, handlePageChange, true);

  const addTag = useCallback(async (name: string): Promise<Tag> => {
    const trimmedName = name.trim().toLowerCase();
    const existingTag = tags.find(tag => tag.name.toLowerCase() === trimmedName);
    if (existingTag) return existingTag;

    return addTagMutation.mutateAsync(trimmedName);
  }, [tags, addTagMutation]);

  const getOrCreateTags = useCallback(async (tagNames: string[]): Promise<Tag[]> => {
    const result: Tag[] = [];
    for (const name of tagNames) {
      try {
        const tag = await addTag(name);
        result.push(tag);
      } catch (error) {
        console.error(`Failed to add tag: ${name}`, error);
      }
    }
    return result;
  }, [addTag]);

  const useTagUsage = (tagId: string) => {
    return useQuery({
      queryKey: ['tagUsage', tagId],
      queryFn: () => getCachedTagUsage(ADMIN_UUID, tagId),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  };

  return {
    tags,
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
    useTagUsage,
  };
}