import { create } from 'zustand';
import { ArtifactWithRelations, FetchOptions } from '@/app/lib/definitions';
import { createArtifact, updateArtifact, deleteArtifact } from '@/app/lib/artifact-actions';
import { fetchSingleArtifact, fetchAllArtifacts } from '@/app/lib/artifact-data';
import { ADMIN_UUID } from '@/app/lib/constants';

type ArtifactStore = {
  artifacts: ArtifactWithRelations[];
  isLoading: boolean;
  error: string | null;
  fetchOptions: FetchOptions;
  setArtifacts: (artifacts: ArtifactWithRelations[]) => void;
  fetchArtifacts: () => Promise<void>;
  updateArtifact: (id: string, formData: FormData) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
  addArtifact: (formData: FormData) => Promise<void>;
  setFetchOptions: (options: FetchOptions) => void;
};

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  artifacts: [],
  isLoading: false,
  error: null,
  fetchOptions: { includeTags: true, includeContents: true, includeProjects: true },
  setArtifacts: (artifacts) => set({ artifacts }),
  fetchArtifacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const artifacts = await fetchAllArtifacts(ADMIN_UUID, get().fetchOptions);
      set({ artifacts, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch artifacts', isLoading: false });
    }
  },
  updateArtifact: async (id, formData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await updateArtifact(id, ADMIN_UUID, {}, formData);
      if (result.message === 'Artifact updated successfully') {
        const updatedArtifact = await fetchSingleArtifact(ADMIN_UUID, id, get().fetchOptions);
        if (updatedArtifact) {
          set((state) => ({
            artifacts: state.artifacts.map((a) => a.id === id ? updatedArtifact : a),
            isLoading: false
          }));
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
        set((state) => ({
          artifacts: state.artifacts.filter((a) => a.id !== id),
          isLoading: false
        }));
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
        const newArtifact = await fetchSingleArtifact(ADMIN_UUID, result.artifactId, get().fetchOptions);
        if (newArtifact) {
          set((state) => ({
            artifacts: [...state.artifacts, newArtifact],
            isLoading: false
          }));
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
  setFetchOptions: (options) => set({ fetchOptions: options }),
}));