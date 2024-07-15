import { create } from 'zustand';
import Fuse from 'fuse.js';
import { ArtifactWithRelations } from '@/app/lib/definitions';
import { useCoreArtifactStore } from './core-artifact-store';
import { useArtifactPaginationStore } from './artifact-pagination-store';

type ArtifactFilterStore = {
  filteredArtifacts: ArtifactWithRelations[];
  query: string;
  fuse: Fuse<ArtifactWithRelations> | null;

  initializeFuse: () => void;
  searchArtifacts: (query: string) => void;
};

export const useArtifactFilterStore = create<ArtifactFilterStore>((set, get) => ({
  filteredArtifacts: [],
  query: '',
  fuse: null,

  initializeFuse: () => {
    const artifacts = useCoreArtifactStore.getState().artifacts;
    const options = {
      keys: ['name', 'description', 'tags.name', 'contents.content'],
      threshold: 0.3,
    };
    set({ fuse: new Fuse(artifacts, options) });
  },

  searchArtifacts: (query) => {
    const { fuse } = get();
    const artifacts = useCoreArtifactStore.getState().artifacts;
    if (!fuse) return;
    
    const results = query 
      ? fuse.search(query).map(result => result.item)
      : artifacts;

    set({ filteredArtifacts: results, query });
    useCoreArtifactStore.getState().setFilteredArtifacts(results);
    useArtifactPaginationStore.getState().updatePagination(results);
  },
}));