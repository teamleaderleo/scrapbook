import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Fuse from 'fuse.js';
import { ArtifactWithRelations, FetchOptions, Tag, BaseProject } from '@/app/lib/definitions';
import { createArtifact, updateArtifact, deleteArtifact } from '@/app/lib/actions/artifact-actions';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedArtifacts } from '@/app/lib/data/cached-artifact-data';
import { handleTagUpdate } from '@/app/lib/actions/tag-handlers';
import { suggestContentExtensions, suggestTags } from '../external/claude-utils';
import { useKeyNav } from './useKeyNav';

const ITEMS_PER_PAGE = 6;

export function useArtifacts() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchOptions, setFetchOptions] = useState<FetchOptions>({
    includeTags: true,
    includeContents: true,
    includeProjects: true,
  });

  const { data: artifacts, isLoading, error } = useQuery<ArtifactWithRelations[], Error>(
    ['artifacts', fetchOptions],
    () => getCachedArtifacts(ADMIN_UUID, fetchOptions),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const fuse = useMemo(() => {
    if (!artifacts) return null;
    return new Fuse(artifacts, {
      keys: ['name', 'description', 'tags.name', 'contents.content'],
      threshold: 0.3,
    });
  }, [artifacts]);

  const filteredArtifacts = useMemo(() => {
    if (!artifacts) return [];
    if (!query) return artifacts;
    return fuse ? fuse.search(query).map(result => result.item) : artifacts;
  }, [artifacts, query, fuse]);

  const totalPages = Math.ceil(filteredArtifacts.length / ITEMS_PER_PAGE);

  const paginatedArtifacts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArtifacts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredArtifacts, currentPage]);

  const updateArtifactMutation = useMutation(
    ({ id, formData }: { id: string; formData: FormData }) => updateArtifact(id, ADMIN_UUID, {}, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['artifacts']);
      },
    }
  );

  const deleteArtifactMutation = useMutation(
    (id: string) => deleteArtifact(id, ADMIN_UUID),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['artifacts']);
      },
    }
  );

  const addArtifactMutation = useMutation(
    (formData: FormData) => createArtifact(ADMIN_UUID, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['artifacts']);
      },
    }
  );

  const updateArtifactTagsMutation = useMutation(
    ({ artifactId, tags }: { artifactId: string; tags: string[] }) =>
      handleTagUpdate(ADMIN_UUID, artifactId, tags),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['artifacts']);
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

  useKeyNav(currentPage, totalPages, handlePageChange);

  const getAISuggestions = useCallback(async (name: string, description: string, content: string) => {
    const tags = await suggestTags(`${name} ${description} ${content}`);
    const extensions = await suggestContentExtensions(`${name} ${description} ${content}`);
    return { tags, extensions };
  }, []);

  return {
    artifacts,
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
    getAISuggestions,
  };
}