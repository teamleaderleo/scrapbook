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
import { useCoreArtifactStore } from './core-artifact-store';
import { useArtifactFilterStore } from './artifact-filter-store';
import { useArtifactPaginationStore } from './artifact-pagination-store';
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

  initializeCoreStore: () => void;
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
  setArtifacts: (artifacts) => {
    useCoreArtifactStore.getState().setArtifacts(artifacts);
    useCoreArtifactStore.getState().setFilteredArtifacts(artifacts);
    set({ artifacts });
    get().initializeFuse();
  },
  setCurrentArtifact: (artifact) => set({ currentArtifact: artifact }),
  initializeArtifacts: (artifacts) => {
    useCoreArtifactStore.getState().setArtifacts(artifacts);
    useArtifactFilterStore.getState().initializeFuse();
    useArtifactFilterStore.getState().searchArtifacts(''); // Reset search
    useArtifactPaginationStore.getState().updatePagination(artifacts);
  },
  initializeCoreStore: () => {
    const coreStore = useCoreArtifactStore.getState();
    set({
      artifacts: coreStore.artifacts,
      currentArtifact: coreStore.currentArtifact,
      isLoading: coreStore.isLoading,
      error: coreStore.error,
      fetchOptions: coreStore.fetchOptions,
    });
  },
  fetchArtifacts: async () => {
    await useCoreArtifactStore.getState().fetchArtifacts();
    const { artifacts, filteredArtifacts, isLoading, error } = useCoreArtifactStore.getState();
    set({ artifacts, filteredArtifacts, isLoading, error });
    get().initializeFuse();
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
    useArtifactPaginationStore.getState().setCurrentPage(page);
    const filteredArtifacts = useArtifactFilterStore.getState().filteredArtifacts;
    useArtifactPaginationStore.getState().updatePagination(filteredArtifacts);
    get().updateUrl(page);
    get().preloadAdjacentPages();
  },

  updateArtifact: async (id, formData) => {
    await useCoreArtifactStore.getState().updateArtifact(id, formData);
    get().initializeCoreStore();
  },
  deleteArtifact: async (id) => {
    await useCoreArtifactStore.getState().deleteArtifact(id);
    get().initializeCoreStore();
  },
  addArtifact: async (formData) => {
    await useCoreArtifactStore.getState().addArtifact(formData);
    get().initializeCoreStore();
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