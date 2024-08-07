import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { Tag } from '@/app/lib/definitions/definitions';
import { 
  createTag, 
  updateTag, 
  deleteTag, 
  associateTagWithProject, 
  associateTagWithBlock, 
  disassociateTagFromProject, 
  disassociateTagFromBlock, 
  getTagsForProject, 
  getTagsForBlock 
} from '@/app/lib/actions/tag-actions';
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
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
    mutationFn: (name: string) => createTag(name, ADMIN_UUID),
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
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const associateTagWithProjectMutation = useMutation({
    mutationFn: ({ tagId, projectId }: { tagId: string; projectId: string }) => 
      associateTagWithProject(tagId, projectId, ADMIN_UUID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const associateTagWithBlockMutation = useMutation({
    mutationFn: ({ tagId, blockId }: { tagId: string; blockId: string }) => 
      associateTagWithBlock(tagId, blockId, ADMIN_UUID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });

  const disassociateTagFromProjectMutation = useMutation({
    mutationFn: ({ tagId, projectId }: { tagId: string; projectId: string }) => 
      disassociateTagFromProject(tagId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const disassociateTagFromBlockMutation = useMutation({
    mutationFn: ({ tagId, blockId }: { tagId: string; blockId: string }) => 
      disassociateTagFromBlock(tagId, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
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

  const useTagsForBlock = (blockId: string) => {
    return useQuery<Tag[], Error>({
      queryKey: ['blockTags', blockId],
      queryFn: () => getTagsForBlock(blockId),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });
  };

  const useTagsForProject = (projectId: string) => {
    return useQuery<Tag[], Error>({
      queryKey: ['projectTags', projectId],
      queryFn: () => getTagsForProject(projectId),
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
    addTag: addTagMutation.mutateAsync,
    updateTag: updateTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
    associateTagWithProject: associateTagWithProjectMutation.mutateAsync,
    associateTagWithBlock: associateTagWithBlockMutation.mutateAsync,
    disassociateTagFromProject: disassociateTagFromProjectMutation.mutateAsync,
    disassociateTagFromBlock: disassociateTagFromBlockMutation.mutateAsync,
    useTagsForBlock,
    useTagsForProject,
  };
}