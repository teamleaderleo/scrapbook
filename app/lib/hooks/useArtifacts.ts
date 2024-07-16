import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Fuse from 'fuse.js';
import { ArtifactWithRelations, FetchOptions, Tag, BaseProject } from '@/app/lib/definitions';
import { createArtifact, updateArtifact, deleteArtifact } from '@/app/lib/actions/artifact-actions';
import { fetchSingleArtifact } from '@/app/lib/data/artifact-data';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedArtifacts } from '@/app/lib/data/cached-artifact-data';
import { handleTagUpdate } from '@/app/lib/actions/tag-actions';

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
      onSuccess: async (result, { id }) => {
        if (result.message === 'Artifact updated successfully') {
          await queryClient.invalidateQueries(['artifacts']);
          const updatedArtifact = await fetchSingleArtifact(ADMIN_UUID, id, fetchOptions);
          if (updatedArtifact) {
            queryClient.setQueryData<ArtifactWithRelations[]>(['artifacts'], (oldData) => 
              oldData?.map((a) => a.id === id ? updatedArtifact : a) ?? []
            );
          }
        }
      },
    }
  );

  const deleteArtifactMutation = useMutation(
    (id: string) => deleteArtifact(id, ADMIN_UUID),
    {
      onSuccess: async (result) => {
        if (result.success) {
          await queryClient.invalidateQueries(['artifacts']);
        }
      },
    }
  );

  const addArtifactMutation = useMutation(
    (formData: FormData) => createArtifact(ADMIN_UUID, formData),
    {
      onSuccess: async (result) => {
        if (result.artifactId) {
          await queryClient.invalidateQueries(['artifacts']);
          const newArtifact = await fetchSingleArtifact(ADMIN_UUID, result.artifactId, fetchOptions);
          if (newArtifact) {
            queryClient.setQueryData<ArtifactWithRelations[]>(['artifacts'], (oldData) => 
              [...(oldData ?? []), newArtifact]
            );
          }
        }
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

  const updateArtifactTags = useCallback(async (artifactId: string, tags: Tag[]) => {
    await handleTagUpdate(ADMIN_UUID, artifactId, tags.map(t => t.name));
    queryClient.invalidateQueries(['artifacts']);
  }, [queryClient]);

  const updateArtifactProjects = useCallback(async (artifactId: string, projects: BaseProject[]) => {
    await handleProjectUpdate(ADMIN_UUID, artifactId, projects.map(p => p.name));
    queryClient.invalidateQueries(['artifacts']);
  }, [queryClient]);

  const preloadAdjacentPages = useCallback(() => {
    // Implement preloading logic here if needed
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
    updateArtifactTags,
    updateArtifactProjects,
    preloadAdjacentPages,
    setFetchOptions,
  };
}