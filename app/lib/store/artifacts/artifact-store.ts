// This store manages local state and updates.

import { create } from 'zustand';
import { ArtifactWithRelations, Tag, BaseProject, ArtifactContent } from '@/app/lib/definitions';
import { getArtifactThumbnail } from '../../utils-client';
import { useArtifactFilterStore } from './artifact-filter-store';
import { useArtifactPaginationStore } from './artifact-pagination-store';
import { eventBus, FILTERED_ARTIFACTS_UPDATED } from '../../event-bus';

type ArtifactStore = {
  artifacts: ArtifactWithRelations[];
  setArtifacts: (artifacts: ArtifactWithRelations[]) => void;
  handleSearch: (query: string) => void;
  handlePageChange: (page: number) => void;
  updateArtifactTags: (id: string, tags: Tag[]) => void;
  updateArtifactContent: (id: string, contents: ArtifactContent[]) => void;
  updateArtifactProjects: (id: string, projects: BaseProject[]) => void;
  preloadAdjacentPages: () => void;
};

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  artifacts: [],
  
  setArtifacts: (artifacts) => {
    set({ artifacts });
    useArtifactFilterStore.getState().initializeFuse(artifacts);
  },

  handleSearch: (query: string) => {
    useArtifactFilterStore.getState().searchArtifacts(query);
  },

  handlePageChange: (page: number) => {
    useArtifactPaginationStore.getState().setCurrentPage(page);
  },

  updateArtifactTags: (id, tags) => {
    set((state) => ({
      artifacts: state.artifacts.map(a => 
        a.id === id ? { ...a, tags } : a
      )
    }));
    useArtifactFilterStore.getState().updateFilteredArtifacts(get().artifacts);
  },

  updateArtifactContent: (id, contents) => {
    set((state) => ({
      artifacts: state.artifacts.map(a => 
        a.id === id ? { ...a, contents } : a
      )
    }));
    useArtifactFilterStore.getState().updateFilteredArtifacts(get().artifacts);
  },

  updateArtifactProjects: (id, projects) => {
    set((state) => ({
      artifacts: state.artifacts.map(a => 
        a.id === id ? { ...a, projects } : a
      )
    }));
    useArtifactFilterStore.getState().updateFilteredArtifacts(get().artifacts);
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

// Preload adjacent pages when filtered artifacts are updated
eventBus.on(FILTERED_ARTIFACTS_UPDATED, () => {
  useArtifactStore.getState().preloadAdjacentPages();
});