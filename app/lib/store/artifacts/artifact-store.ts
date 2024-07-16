import { create } from 'zustand';
import { QueryClient, useQuery } from 'react-query';
import { ArtifactWithRelations, FetchOptions, Tag, BaseProject, ArtifactContent } from '@/app/lib/definitions';
import { ADMIN_UUID } from '@/app/lib/constants';
import { getCachedArtifacts } from '../../data/cached-artifact-data';
import { getArtifactThumbnail } from '../../utils-client';
import { useCoreArtifactStore } from './core-artifact-store';
import { useArtifactFilterStore } from './artifact-filter-store';
import { useArtifactPaginationStore } from './artifact-pagination-store';
import { eventBus, ARTIFACTS_UPDATED, FILTERED_ARTIFACTS_UPDATED } from '../../event-bus';

const queryClient = new QueryClient();

type ArtifactStore = {
  initializeStore: () => void;
  handleSearch: (query: string) => void;
  handlePageChange: (page: number) => void;
  updateArtifact: (id: string, formData: FormData) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
  addArtifact: (formData: FormData) => Promise<void>;
  updateArtifactTags: (id: string, tags: Tag[]) => void;
  updateArtifactContent: (id: string, contents: ArtifactContent[]) => void;
  updateArtifactProjects: (id: string, projects: BaseProject[]) => void;
  preloadAdjacentPages: () => void;
};

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  initializeStore: () => {
    useCoreArtifactStore.getState().fetchArtifacts();
  },

  handleSearch: (query: string) => {
    useArtifactFilterStore.getState().searchArtifacts(query);
  },

  handlePageChange: (page: number) => {
    useArtifactPaginationStore.getState().setCurrentPage(page);
  },

  updateArtifact: async (id, formData) => {
    await useCoreArtifactStore.getState().updateArtifact(id, formData);
  },

  deleteArtifact: async (id) => {
    await useCoreArtifactStore.getState().deleteArtifact(id);
  },

  addArtifact: async (formData) => {
    await useCoreArtifactStore.getState().addArtifact(formData);
  },

  updateArtifactTags: (id, tags) => {
    const coreStore = useCoreArtifactStore.getState();
    const updatedArtifacts = coreStore.artifacts.map(a => 
      a.id === id ? { ...a, tags } : a
    );
    coreStore.setArtifacts(updatedArtifacts);
  },

  updateArtifactContent: (id, contents) => {
    const coreStore = useCoreArtifactStore.getState();
    const updatedArtifacts = coreStore.artifacts.map(a => 
      a.id === id ? { ...a, contents } : a
    );
    coreStore.setArtifacts(updatedArtifacts);
  },

  updateArtifactProjects: (id, projects) => {
    const coreStore = useCoreArtifactStore.getState();
    const updatedArtifacts = coreStore.artifacts.map(a => 
      a.id === id ? { ...a, projects } : a
    );
    coreStore.setArtifacts(updatedArtifacts);
  },

  preloadAdjacentPages: () => {
    const { filteredArtifacts } = useArtifactFilterStore.getState();
    const { currentPage, itemsPerPage } = useArtifactPaginationStore.getState();
    const prevStart = Math.max(0, (currentPage - 2) * itemsPerPage);
    const nextEnd = Math.min(filteredArtifacts.length, (currentPage + 1) * itemsPerPage);
    
    const adjacentArtifacts = filteredArtifacts.slice(prevStart, nextEnd);
    
    adjacentArtifacts.forEach(artifact => {
      const thumbnailData = getArtifactThumbnail(artifact);
      const img = new Image();
      img.src = thumbnailData.src;
      img.width = thumbnailData.width;
      img.height = thumbnailData.height;
    });
  },
}));

export const useArtifacts = () => {
  const { fetchOptions } = useCoreArtifactStore();
  return useQuery<ArtifactWithRelations[], Error>(
    ['artifacts', fetchOptions],
    () => getCachedArtifacts(ADMIN_UUID, fetchOptions),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

// Preload adjacent pages when filtered artifacts are updated
eventBus.on(FILTERED_ARTIFACTS_UPDATED, () => {
  useArtifactStore.getState().preloadAdjacentPages();
});