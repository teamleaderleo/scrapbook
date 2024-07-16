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
};

export const useArtifactFilterStore = create<ArtifactFilterStore>((set, get) => ({
  filteredArtifacts: [],
  query: '',
  fuse: null,
  allArtifacts: [],

  initializeFuse: (artifacts: ArtifactWithRelations[]) => {
    const options = {
      keys: ['name', 'description', 'tags.name', 'contents.content'],
      threshold: 0.3,
    };
    const fuse = new Fuse(artifacts, options);
    set({ fuse, allArtifacts: artifacts, filteredArtifacts: artifacts });
    eventBus.emit(FILTERED_ARTIFACTS_UPDATED, artifacts);
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
}));

// Listen for the ARTIFACTS_UPDATED event
eventBus.on(ARTIFACTS_UPDATED, (artifacts: ArtifactWithRelations[]) => {
  useArtifactFilterStore.getState().initializeFuse(artifacts);
});