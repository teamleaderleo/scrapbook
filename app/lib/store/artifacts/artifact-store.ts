import { create } from 'zustand';
import Fuse from 'fuse.js';
import { QueryClient, useQuery } from 'react-query';
import { ArtifactWithRelations, FetchOptions, Tag, BaseProject, ArtifactContent } from '@/app/lib/definitions';
import { createArtifact, updateArtifact, deleteArtifact } from '@/app/lib/actions/artifact-actions';
import { fetchSingleArtifact, fetchAllArtifacts } from '@/app/lib/data/artifact-data';
import { ADMIN_UUID } from '@/app/lib/constants';
import { handleTagUpdate } from '../../actions/tag-actions';
import { getCachedArtifacts } from '../../data/cached-artifact-data';
import { getArtifactThumbnail } from '../../utils-client';

const queryClient = new QueryClient();

type ArtifactStore = {
  artifacts: ArtifactWithRelations[];
  currentArtifact: ArtifactWithRelations | null;
  filteredArtifacts: ArtifactWithRelations[];
  paginatedArtifacts: ArtifactWithRelations[];
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  query: string;
  fuse: Fuse<ArtifactWithRelations> | null;

  isLoading: boolean;
  error: string | null;
  fetchOptions: FetchOptions;

  initializeArtifacts: (artifacts: ArtifactWithRelations[]) => void;

  updateUrl: (page: number) => void;
  setUpdateUrl: (updateUrlFunction: (page: number) => void) => void;
  handleSearch: (query: string, page: number) => void;
  handlePageChange: (page: number) => void;
  
  fetchArtifacts: () => Promise<void>;
  updateArtifact: (id: string, formData: FormData) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
  addArtifact: (formData: FormData) => Promise<void>;
  setArtifacts: (artifacts: ArtifactWithRelations[]) => void;
  setCurrentArtifact: (artifact: ArtifactWithRelations | null) => void;

  setFetchOptions: (options: FetchOptions) => void;

  initializeFuse: () => void;
  searchArtifacts: (query: string) => void;
  updateArtifactTags: (id: string, tags: Tag[]) => void;
  updateArtifactContent: (id: string, contents: ArtifactContent[]) => void;
  
  setCurrentPage: (page: number) => void;
  preloadAdjacentPages: () => void;
};

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  artifacts: [],
  currentArtifact: null,
  filteredArtifacts: [],
  paginatedArtifacts: [],
  currentPage: 1,
  itemsPerPage: 6,
  totalPages: 0,
  query: '',
  isLoading: false,
  error: null,
  fetchOptions: { includeTags: true, includeContents: true, includeProjects: true },
  setArtifacts: (artifacts) => set({ artifacts }),
  setCurrentArtifact: (artifact) => set({ currentArtifact: artifact }),
  initializeArtifacts: (artifacts) => {
    const fuse = new Fuse(artifacts, {
      keys: ['name', 'description', 'tags.name', 'contents.content'],
      threshold: 0.3,
    });
    set({ artifacts, filteredArtifacts: artifacts, fuse });
    get().handleSearch(get().query, get().currentPage);
  },
  fetchArtifacts: async () => {
    const artifacts = await queryClient.fetchQuery(
      ['artifacts', get().fetchOptions],
      () => getCachedArtifacts(ADMIN_UUID, get().fetchOptions)
    );
    set({ artifacts, filteredArtifacts: artifacts, isLoading: false });
  },

  handleSearch: (query, page) => {
    const { fuse, artifacts, itemsPerPage } = get();
    const filteredArtifacts = query && fuse 
      ? fuse.search(query).map(result => result.item)
      : artifacts;
    
    const totalPages = Math.ceil(filteredArtifacts.length / itemsPerPage);
    const paginatedArtifacts = filteredArtifacts.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );

    set({ 
      query,
      filteredArtifacts, 
      currentPage: page,
      totalPages,
      paginatedArtifacts
    });
  },

  preloadAdjacentPages: () => {
    const { filteredArtifacts, currentPage, itemsPerPage } = get();
    const prevStart = Math.max(0, (currentPage - 2) * itemsPerPage);
    const nextEnd = Math.min(filteredArtifacts.length, (currentPage + 1) * itemsPerPage);
    
    const adjacentArtifacts = filteredArtifacts.slice(prevStart, nextEnd);

    console.log(`Preloading ${adjacentArtifacts.length} artifacts for adjacent pages`);
    
    adjacentArtifacts.forEach(artifact => {
      const thumbnailData = getArtifactThumbnail(artifact);
      const img = new Image();
      img.src = thumbnailData.src;
      img.width = thumbnailData.width;
      img.height = thumbnailData.height;
    });
  },

  updateUrl: () => {}, // Initialize with a no-op function

  setUpdateUrl: (updateUrlFunction) => set({ updateUrl: updateUrlFunction }),

  handlePageChange: (page) => {
    get().handleSearch(get().query, page);
    get().updateUrl(page);
    get().preloadAdjacentPages();
  },

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
        await queryClient.invalidateQueries(['artifacts']);
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
        await queryClient.invalidateQueries(['artifacts']);
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
  setCurrentPage: (page) => set({ currentPage: page }),
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
  updateArtifactTags: (id, tags) => {
    set((state) => ({
      artifacts: state.artifacts.map(a => 
        a.id === id ? { ...a, tags } : a
      ),
      currentArtifact: state.currentArtifact && state.currentArtifact.id === id
        ? { ...state.currentArtifact, tags }
        : state.currentArtifact,
    }));
  },
  updateArtifactContent: (id, contents) => {
    set((state) => ({
      artifacts: state.artifacts.map(a => 
        a.id === id ? { ...a, contents } : a
      ),
      currentArtifact: state.currentArtifact && state.currentArtifact.id === id
        ? { ...state.currentArtifact, contents }
        : state.currentArtifact,
    }));
  },
  updateArtifactProjects: (id: string, projects: BaseProject[]) => {
    set((state) => ({
      artifacts: state.artifacts.map(a => 
        a.id === id ? { ...a, projects } : a
      ),
      currentArtifact: state.currentArtifact && state.currentArtifact.id === id
        ? { ...state.currentArtifact, projects }
        : state.currentArtifact,
    }));
  },
  
}));

export const useArtifacts = () => {
  const { fetchOptions } = useArtifactStore();
  return useQuery<ArtifactWithRelations[], Error>(
    ['artifacts', fetchOptions],
    () => getCachedArtifacts(ADMIN_UUID, fetchOptions),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};