import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { BlockWithRelations, BlockFormSubmission } from "../definitions/definitions";
import { createBlock, updateBlock, deleteBlock } from '@/app/lib/actions/block-actions';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedBlocks } from '@/app/lib/data/cached-block-data';
// import { handleTagUpdate } from '@/app/lib/actions/tag-handlers';
import { useKeyNav } from './useKeyNav';

const ITEMS_PER_PAGE = 6;

export function useBlocks() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: blocks, isLoading, error } = useQuery<BlockWithRelations[], Error>({
    queryKey: ['blocks'],
    queryFn: () => getCachedBlocks(ADMIN_UUID),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const fuse = useMemo(() => {
    if (!blocks) return null;
    return new Fuse(blocks, {
      keys: ['content.content'],
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

  const updateBlockMutation = useMutation({
    mutationFn: (data: { id: string; data: BlockFormSubmission }) => 
      updateBlock(data.id, ADMIN_UUID, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => deleteBlock(id, ADMIN_UUID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });

  const addBlockMutation = useMutation({
    mutationFn: (data: BlockFormSubmission) => createBlock(ADMIN_UUID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });

  const updateBlockTagsMutation = useMutation({
    mutationFn: ({ blockId, tags }: { blockId: string; tags: string[] }) =>
      handleTagUpdate(ADMIN_UUID, blockId, 'block', tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  useKeyNav(currentPage, totalPages, handlePageChange, true);

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
    updateBlock: updateBlockMutation.mutate,
    deleteBlock: deleteBlockMutation.mutate,
    addBlock: addBlockMutation.mutate,
    updateBlockTags: updateBlockTagsMutation.mutate,
  };
}