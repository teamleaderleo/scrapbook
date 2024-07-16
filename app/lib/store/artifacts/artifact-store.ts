// This store manages local state and updates.

import { create } from 'zustand';
import { ArtifactWithRelations, Tag, BaseProject, ArtifactContent } from '@/app/lib/definitions';
import { getArtifactThumbnail } from '../../utils-client';
import { useArtifactFilterStore } from './artifact-filter-store';
import { useArtifactPaginationStore } from './artifact-pagination-store';
import { eventBus, FILTERED_ARTIFACTS_UPDATED, ARTIFACTS_UPDATED } from '../../event-bus';

type ArtifactStore = {
  artifacts: ArtifactWithRelations[];
  setArtifacts: (artifacts: ArtifactWithRelations[]) => void;
  updateArtifacts: (artifacts: ArtifactWithRelations[]) => void;
  handleSearch: (query: string) => void;
  handlePageChange: (page: number) => void;
  updateArtifactTags: (id: string, tags: Tag[]) => void;
  updateArtifactContent: (id: string, contents: ArtifactContent[]) => void;
  updateArtifactProjects: (id: string, projects: BaseProject[]) => void;
  preloadAdjacentPages: () => void;
};

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function isDeepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key) || !isDeepEqual(obj1[key], obj2[key])) return false;
  }
  return true;
}

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  artifacts: [],
  
  setArtifacts: (artifacts) => {
    set((state) => {
      if (!isDeepEqual(state.artifacts, artifacts)) {
        return { artifacts };
      }
      return state;
    });
  },

  updateArtifacts: debounce((artifacts: ArtifactWithRelations[]) => {
    set((state) => {
      if (!isDeepEqual(state.artifacts, artifacts)) {
        eventBus.emit(ARTIFACTS_UPDATED, artifacts);
        return { artifacts };
      }
      return state;
    });
  }, 100),

  handleSearch: (query: string) => {
    useArtifactFilterStore.getState().searchArtifacts(query);
  },

  handlePageChange: (page: number) => {
    useArtifactPaginationStore.getState().setCurrentPage(page);
  },

  updateArtifactTags: (id, tags) => {
    set((state) => {
      const updatedArtifacts = state.artifacts.map(a => 
        a.id === id ? { ...a, tags } : a
      );
      if (!isDeepEqual(state.artifacts, updatedArtifacts)) {
        eventBus.emit(ARTIFACTS_UPDATED, updatedArtifacts);
        return { artifacts: updatedArtifacts };
      }
      return state;
    });
  },

  updateArtifactContent: (id, contents) => {
    set((state) => {
      const updatedArtifacts = state.artifacts.map(a => 
        a.id === id ? { ...a, contents } : a
      );
      if (!isDeepEqual(state.artifacts, updatedArtifacts)) {
        eventBus.emit(ARTIFACTS_UPDATED, updatedArtifacts);
        return { artifacts: updatedArtifacts };
      }
      return state;
    });
  },

  updateArtifactProjects: (id, projects) => {
    set((state) => {
      const updatedArtifacts = state.artifacts.map(a => 
        a.id === id ? { ...a, projects } : a
      );
      if (!isDeepEqual(state.artifacts, updatedArtifacts)) {
        eventBus.emit(ARTIFACTS_UPDATED, updatedArtifacts);
        return { artifacts: updatedArtifacts };
      }
      return state;
    });
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