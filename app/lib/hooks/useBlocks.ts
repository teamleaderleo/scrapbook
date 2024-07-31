import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Fuse from 'fuse.js';
import { BlockFetchOptions, Tag } from '@/app/lib/definitions/definitions';
import { BlockWithRelations } from "../definitions/definitions";
import { BaseProject } from "../definitions/definitions";
import { createBlock, updateBlock, deleteBlock } from '@/app/lib/actions/block-actions';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedBlocks } from '@/app/lib/data/cached-block-data';
import { handleTagUpdate } from '@/app/lib/actions/tag-handlers';
import { suggestContentExtensions, suggestTags } from '../external/claude-utils';
import { useKeyNav } from './useKeyNav';

const ITEMS_PER_PAGE = 6;

export function useBlocks() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchOptions, setFetchOptions] = useState<BlockFetchOptions>({
    includeTags: true,
    includeProjects: true,
  });

  const { data: blocks, isLoading, error } = useQuery<BlockWithRelations[], Error>(
    ['blocks', fetchOptions],
    () => getCachedBlocks(ADMIN_UUID),
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

  const filteredBlocks = useMemo(() => {
    if (!blocks) return [];
    if (!query) return blocks;
    return fuse ? fuse.search(query).map(result => result.item) : blocks;
  }, [blocks, query, fuse]);

  const totalPages = Math.ceil(filteredBlocks.length / ITEMS_PER_PAGE);

  const paginatedBlocks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBlocks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBlocks, currentPage]);

  const updateBlockMutation = useMutation(
    ({ id }: { id: string }) => updateBlock(id, ADMIN_UUID, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blocks']);
      },
    }
  );

  const deleteBlockMutation = useMutation(
    ({ id }: { id: string }) => deleteBlock(id, ADMIN_UUID, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blocks']);
      },
    }
  );

  const addBlockMutation = useMutation(
    (data: BlockFormSubmission) => createBlock(ADMIN_UUID, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blocks']);
      },
    }
  );

  const updateBlockTagsMutation = useMutation(
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
    filteredBlocks,
    paginatedBlocks,
    isLoading,
    error,
    query,
    currentPage,
    totalPages,
    handleSearch,
    handlePageChange,
    updateBlock: updateBlockMutation.mutateAsync,
    deleteBlock: deleteBlockMutation.mutateAsync,
    addBlock: addBlockMutation.mutateAsync,
    updateBlockTags: updateBlockTagsMutation.mutateAsync,
    setFetchOptions,
    // getAISuggestions,
  };
}