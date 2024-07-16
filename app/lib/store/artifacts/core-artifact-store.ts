// This store handles data fetching and server-side mutations using React Query.
// Usage of React Query in core-artifact-store.ts:
// React Query provides hooks like useQuery and useMutation that manage 
// the entire lifecycle of asynchronous operations, including loading states, 
// error handling, and caching.

// In core-artifact-store.ts, we define the mutation using useMutation.

import { create } from 'zustand';
import { QueryClient, useQuery, useMutation } from 'react-query';
import { ArtifactWithRelations, FetchOptions } from '@/app/lib/definitions';
import { createArtifact, updateArtifact, deleteArtifact } from '@/app/lib/actions/artifact-actions';
import { fetchSingleArtifact } from '@/app/lib/data/artifact-data';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedArtifacts } from '../../data/cached-artifact-data';
import { eventBus, ARTIFACTS_UPDATED } from '../../event-bus';

const queryClient = new QueryClient();

type CoreArtifactStore = {
  fetchOptions: FetchOptions;
  setFetchOptions: (options: FetchOptions) => void;
};

export const useCoreArtifactStore = create<CoreArtifactStore>((set) => ({
  fetchOptions: { includeTags: true, includeContents: true, includeProjects: true },
  setFetchOptions: (options) => set({ fetchOptions: options }),
}));

export const useArtifacts = () => {
  const { fetchOptions } = useCoreArtifactStore();
  return useQuery<ArtifactWithRelations[], Error>(
    ['artifacts', fetchOptions],
    () => getCachedArtifacts(ADMIN_UUID, fetchOptions),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onSuccess: (data) => {
        eventBus.emit(ARTIFACTS_UPDATED, data);
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
};

export const useUpdateArtifact = () => {
  return useMutation(
    ({ id, formData }: { id: string; formData: FormData }) => updateArtifact(id, ADMIN_UUID, {}, formData),
    {
      onSuccess: async (result, { id }) => {
        if (result.message === 'Artifact updated successfully') {
          await queryClient.invalidateQueries(['artifacts']);
          const { fetchOptions } = useCoreArtifactStore.getState();
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
};

export const useDeleteArtifact = () => {
  return useMutation(
    (id: string) => deleteArtifact(id, ADMIN_UUID),
    {
      onSuccess: async (result) => {
        if (result.success) {
          await queryClient.invalidateQueries(['artifacts']);
        }
      },
    }
  );
};

export const useAddArtifact = () => {
  return useMutation(
    (formData: FormData) => createArtifact(ADMIN_UUID, formData),
    {
      onSuccess: async (result) => {
        if (result.artifactId) {
          await queryClient.invalidateQueries(['artifacts']);
          const { fetchOptions } = useCoreArtifactStore.getState();
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
};