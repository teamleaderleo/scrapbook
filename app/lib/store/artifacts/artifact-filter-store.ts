// This store handles searching and filtering.

import { create } from 'zustand';
import Fuse from 'fuse.js';
import { ArtifactWithRelations } from '@/app/lib/definitions';
import { eventBus, ARTIFACTS_UPDATED, FILTERED_ARTIFACTS_UPDATED } from '../../event-bus';

type ArtifactFilterStore = {
  filteredArtifacts: ArtifactWithRelations[];
  query: string;
  fuse: Fuse<ArtifactWithRelations> | null;
  allArtifacts: ArtifactWithRelations[];

  initializeFuse: (artifacts: ArtifactWithRelations[]) => void;
  searchArtifacts: (query: string) => void;
  updateFilteredArtifacts: (artifacts: ArtifactWithRelations[]) => void;
};

const fuseOptions = {
  keys: ['name', 'description', 'tags.name', 'contents.content'],
  threshold: 0.3,
};

export const useArtifactFilterStore = create<ArtifactFilterStore>((set, get) => ({
  filteredArtifacts: [],
  query: '',
  fuse: null,
  allArtifacts: [],

  initializeFuse: (artifacts: ArtifactWithRelations[]) => {
    const fuse = new Fuse(artifacts, fuseOptions);
    set({ fuse, allArtifacts: artifacts, filteredArtifacts: artifacts });
  },

  searchArtifacts: (query: string) => {
    const { fuse, allArtifacts } = get();
    if (!fuse) return;
    
    const results = query 
      ? fuse.search(query).map(result => result.item)
      : allArtifacts;

    set({ query, filteredArtifacts: results });
    eventBus.emit(FILTERED_ARTIFACTS_UPDATED, results);
  },

  updateFilteredArtifacts: (artifacts: ArtifactWithRelations[]) => {
    const { query } = get();
    const updatedFuse = new Fuse(artifacts, fuseOptions);
    const results = query
      ? updatedFuse.search(query).map(result => result.item)
      : artifacts;
    set({ fuse: updatedFuse, allArtifacts: artifacts, filteredArtifacts: results });
    eventBus.emit(FILTERED_ARTIFACTS_UPDATED, results);
  },
}));

// Listen for the artifactsUpdated event
eventBus.on(ARTIFACTS_UPDATED, (artifacts: ArtifactWithRelations[]) => {
  useArtifactFilterStore.getState().initializeFuse(artifacts);
});