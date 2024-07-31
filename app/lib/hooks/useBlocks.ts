import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Fuse from 'fuse.js';
import { ArtifactFetchOptions, Tag } from '@/app/lib/definitions/definitions';
import { ArtifactWithRelations } from "../definitions/definitions";
import { BaseProject } from "../definitions/definitions";
import { createArtifact, updateArtifact, deleteArtifact } from '@/app/lib/actions/block-actions';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedArtifacts } from '@/app/lib/data/cached-block-data';
import { handleTagUpdate } from '@/app/lib/actions/tag-handlers';
import { suggestContentExtensions, suggestTags } from '../external/claude-utils';
import { useKeyNav } from './useKeyNav';
import { ArtifactFormSubmission } from '../definitions/definitions';

const ITEMS_PER_PAGE = 6;

export function useArtifacts() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchOptions, setFetchOptions] = useState<ArtifactFetchOptions>({
    includeTags: true,
    includeContents: true,
    includeProjects: true,
  });

  const { data: blocks, isLoading, error } = useQuery<ArtifactWithRelations[], Error>(
    ['blocks', fetchOptions],
    () => getCachedArtifacts(ADMIN_UUID),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const fuse = useMemo(() => {
    if (!blocks) return null;
    return new Fuse(blocks, {
      keys: ['name', 'description', 'tags.name', 'contents.content'],
      threshold: 0.3,
    });
  }, [blocks]);

  const filteredArtifacts = useMemo(() => {
    if (!blocks) return [];
    if (!query) return blocks;
    return fuse ? fuse.search(query).map(result => result.item) : blocks;
  }, [blocks, query, fuse]);

  const totalPages = Math.ceil(filteredArtifacts.length / ITEMS_PER_PAGE);

  const paginatedArtifacts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArtifacts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredArtifacts, currentPage]);

  const updateArtifactMutation = useMutation(
    ({ id, data }: { id: string; data: ArtifactFormSubmission }) => updateArtifact(id, ADMIN_UUID, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blocks']);
      },
    }
  );

  const deleteArtifactMutation = useMutation(
    ({ id, data }: { id: string; data: ArtifactFormSubmission }) => deleteArtifact(id, ADMIN_UUID, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blocks']);
      },
    }
  );

  const addArtifactMutation = useMutation(
    (data: ArtifactFormSubmission) => createArtifact(ADMIN_UUID, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blocks']);
      },
    }
  );

  const updateArtifactTagsMutation = useMutation(
    ({ blockId, tags }: { blockId: string; tags: string[] }) =>
      handleTagUpdate(ADMIN_UUID, blockId, 'block', tags),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blocks']);
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

  // const getAISuggestions = useCallback(async (name: string, description: string, content: string) => {
  //   const tags = await suggestTags(`${name} ${description} ${content}`);
  //   const extensions = await suggestContentExtensions(`${name} ${description} ${content}`);
  //   return { tags, extensions };
  // }, []);

  return {
    blocks,
    filteredArtifacts,
    paginatedArtifacts,
    isLoading,
    error,
    query,
    currentPage,
    totalPages,
    handleSearch,
    handlePageChange,
    updateArtifact: updateArtifactMutation.mutateAsync,
    deleteArtifact: deleteArtifactMutation.mutateAsync,
    addArtifact: addArtifactMutation.mutateAsync,
    updateArtifactTags: updateArtifactTagsMutation.mutateAsync,
    setFetchOptions,
    // getAISuggestions,
  };
}