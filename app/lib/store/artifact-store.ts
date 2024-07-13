import { create } from 'zustand';
import Fuse from 'fuse.js';
import { ArtifactWithRelations, FetchOptions, Tag } from '@/app/lib/definitions';
import { createArtifact, updateArtifact, deleteArtifact } from '@/app/lib/actions/artifact-actions';
import { fetchSingleArtifact, fetchAllArtifacts } from '@/app/lib/data/artifact-data';
import { ADMIN_UUID } from '@/app/lib/constants';
import { handleTagUpdate } from '../actions/tag-handlers';

type ArtifactStore = {
  artifacts: ArtifactWithRelations[];
  filteredArtifacts: ArtifactWithRelations[];
  currentPage: number;
  itemsPerPage: number;
  isLoading: boolean;
  error: string | null;
  fetchOptions: FetchOptions;
  setArtifacts: (artifacts: ArtifactWithRelations[]) => void;
  fetchArtifacts: () => Promise<void>;
  updateArtifact: (id: string, formData: FormData) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
  addArtifact: (formData: FormData) => Promise<void>;
  setFetchOptions: (options: FetchOptions) => void;
  fuse: Fuse<ArtifactWithRelations> | null;
  initializeFuse: () => void;
  searchArtifacts: (query: string) => void;
  updateArtifactTags: (artifactId: string, tags: Tag[]) => Promise<void>;
  setCurrentPage: (page: number) => void;
};

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  artifacts: [],
  filteredArtifacts: [],
  currentPage: 1,
  itemsPerPage: 6,
  isLoading: false,
  error: null,
  fetchOptions: { includeTags: true, includeContents: true, includeProjects: true },
  setArtifacts: (artifacts) => set({ artifacts, filteredArtifacts: artifacts }),
  fetchArtifacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const artifacts = await fetchAllArtifacts(ADMIN_UUID, get().fetchOptions);
      set({ artifacts, filteredArtifacts: artifacts, isLoading: false });
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
          set((state) => {
            const updatedArtifacts = state.artifacts.map((a) => a.id === id ? updatedArtifact : a);
            return {
              artifacts: updatedArtifacts,
              filteredArtifacts: updatedArtifacts,
              isLoading: false
            };
          });
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
        set((state) => {
          const updatedArtifacts = state.artifacts.filter((a) => a.id !== id);
          return {
            artifacts: updatedArtifacts,
            filteredArtifacts: updatedArtifacts,
            isLoading: false
          };
        });
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
          set((state) => {
            const updatedArtifacts = [...state.artifacts, newArtifact];
            return {
              artifacts: updatedArtifacts,
              filteredArtifacts: updatedArtifacts,
              isLoading: false
            };
          });
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
  fuse: null,
  initializeFuse: () => {
    const options = {
      keys: ['name', 'description', 'tags.name', 'contents.content'],
      threshold: 0.3,
    };
    set({ fuse: new Fuse(get().artifacts, options) });
  },
  searchArtifacts: (query) => {
    const { fuse, artifacts } = get();
    if (!fuse) return;
    
    const results = query 
      ? fuse.search(query).map(result => result.item)
      : artifacts;

    set({ 
      filteredArtifacts: results,
      currentPage: 1
    });
  },
  updateArtifactTags: async (artifactId, tags) => {
    set({ isLoading: true, error: null });
    try {
      await handleTagUpdate(ADMIN_UUID, artifactId, tags.map(tag => tag.name), false);
      set((state) => ({
        artifacts: state.artifacts.map((artifact) =>
          artifact.id === artifactId ? { ...artifact, tags } : artifact
        ),
        filteredArtifacts: state.filteredArtifacts.map((artifact) =>
          artifact.id === artifactId ? { ...artifact, tags } : artifact
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update artifact tags', isLoading: false });
    }
  },
  setCurrentPage: (page) => set({ currentPage: page }),
}));