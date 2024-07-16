// In use-artifact-queries.ts, we use mutateAsync to actually trigger the mutation 
// and wait for it to complete.

// Centralization:
// While we've separated concerns, use-artifact-queries.ts acts as a centralized point 
// that combines all the functionality for components to use.

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useArtifactStore } from './artifact-store';
import { useArtifactFilterStore } from './artifact-filter-store';
import { useArtifactPaginationStore } from './artifact-pagination-store';
import { useArtifacts, useUpdateArtifact, useDeleteArtifact, useAddArtifact } from './core-artifact-store';
import React from 'react';

export function useArtifactQueries() {
  const queryClient = useQueryClient();
  if (!queryClient) {
    throw new Error("useArtifactQueries must be used within a QueryClientProvider");
  }

  const artifactStore = useArtifactStore();
  const filterStore = useArtifactFilterStore();
  const paginationStore = useArtifactPaginationStore();
  
  const { 
    data: queryArtifacts, 
    isLoading, 
    error 
  } = useArtifacts();

  const updateArtifactMutation = useUpdateArtifact();
  const deleteArtifactMutation = useDeleteArtifact();
  const addArtifactMutation = useAddArtifact();

  // Update artifacts in the store whenever they change
  React.useEffect(() => {
    if (queryArtifacts) {
      artifactStore.updateArtifacts(queryArtifacts);
    }
  }, [queryArtifacts, artifactStore]);

  const updateArtifact = async (id: string, formData: FormData) => {
    await updateArtifactMutation.mutateAsync({ id, formData });
  };

  const deleteArtifact = async (id: string) => {
    await deleteArtifactMutation.mutateAsync(id);
  };

  const addArtifact = async (formData: FormData) => {
    await addArtifactMutation.mutateAsync(formData);
  };

  return {
    queryArtifacts,
    isLoading,
    error,
    updateArtifact,
    deleteArtifact,
    addArtifact,
    ...artifactStore,
    filteredArtifacts: filterStore.filteredArtifacts,
    currentPage: paginationStore.currentPage,
    totalPages: paginationStore.totalPages,
  };
}