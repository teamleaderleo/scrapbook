import { create } from 'zustand';
import { QueryClient, useQuery } from 'react-query';
import { ArtifactWithRelations, FetchOptions } from '@/app/lib/definitions';
import { createArtifact, updateArtifact, deleteArtifact } from '@/app/lib/actions/artifact-actions';
import { fetchSingleArtifact, fetchAllArtifacts } from '@/app/lib/data/artifact-data';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedArtifacts } from '../../data/cached-artifact-data';
import { eventBus, ARTIFACTS_UPDATED, FILTERED_ARTIFACTS_UPDATED } from '../../event-bus';

const queryClient = new QueryClient();

type CoreArtifactStore = {
  artifacts: ArtifactWithRelations[];
  filteredArtifacts: ArtifactWithRelations[];

  currentArtifact: ArtifactWithRelations | null;
  isLoading: boolean;
  error: string | null;
  fetchOptions: FetchOptions;

  updateArtifact: (id: string, formData: FormData) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
  addArtifact: (formData: FormData) => Promise<void>;
  fetchArtifacts: () => Promise<void>;
  setArtifacts: (artifacts: ArtifactWithRelations[]) => void;
};

export const useCoreArtifactStore = create<CoreArtifactStore>((set, get) => ({
  artifacts: [],
  filteredArtifacts: [],
  currentArtifact: null,
  isLoading: false,
  error: null,
  fetchOptions: { includeTags: true, includeContents: true, includeProjects: true },

  updateArtifact: async (id, formData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await updateArtifact(id, ADMIN_UUID, {}, formData);
      if (result.message === 'Artifact updated successfully') {
        await queryClient.invalidateQueries(['artifacts']);
        const updatedArtifact = await fetchSingleArtifact(ADMIN_UUID, id, get().fetchOptions);
        if (updatedArtifact) {
          set((state) => {
            const updatedArtifacts = state.artifacts.map((a) => a.id === id ? updatedArtifact : a);
            return { artifacts: updatedArtifacts, isLoading: false };
          });
          eventBus.emit(ARTIFACTS_UPDATED, get().artifacts);
        } else {
          throw new Error('Failed to fetch updated artifact');
        }
      } else {
        throw new Error(result.message || 'Failed to update artifact');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
    }
  },

  deleteArtifact: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await deleteArtifact(id, ADMIN_UUID);
      if (result.success) {
        await queryClient.invalidateQueries(['artifacts']);
        set((state) => {
          const updatedArtifacts = state.artifacts.filter((a) => a.id !== id);
          return { artifacts: updatedArtifacts, isLoading: false };
        });
        eventBus.emit(ARTIFACTS_UPDATED, get().artifacts);
      } else {
        throw new Error(result.message || 'Failed to delete artifact');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
    }
  },

  addArtifact: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await createArtifact(ADMIN_UUID, formData);
      if (result.artifactId) {
        await queryClient.invalidateQueries(['artifacts']);
        const newArtifact = await fetchSingleArtifact(ADMIN_UUID, result.artifactId, get().fetchOptions);
        if (newArtifact) {
          set((state) => {
            const updatedArtifacts = [...state.artifacts, newArtifact];
            return { artifacts: updatedArtifacts, isLoading: false };
          });
          eventBus.emit(ARTIFACTS_UPDATED, get().artifacts);
        } else {
          throw new Error('Failed to fetch new artifact');
        }
      } else {
        throw new Error(result.message || 'Failed to create artifact');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An unknown error occurred', isLoading: false });
    }
  },

  fetchArtifacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const artifacts = await queryClient.fetchQuery(
        ['artifacts', get().fetchOptions],
        () => getCachedArtifacts(ADMIN_UUID, get().fetchOptions)
      );
      set({ artifacts, isLoading: false });
      eventBus.emit(ARTIFACTS_UPDATED, artifacts);
    } catch (error) {
      set({ error: 'Failed to fetch artifacts', isLoading: false });
    }
  },

  setArtifacts: (artifacts: ArtifactWithRelations[]) => {
    set({ artifacts });
    eventBus.emit(ARTIFACTS_UPDATED, artifacts);
  },
}));