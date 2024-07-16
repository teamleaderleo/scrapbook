// This store manages pagination.

import { create } from 'zustand';
import { ArtifactWithRelations } from '@/app/lib/definitions';
import { eventBus, ARTIFACTS_UPDATED, FILTERED_ARTIFACTS_UPDATED } from '../../event-bus';

type ArtifactPaginationStore = {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  paginatedArtifacts: ArtifactWithRelations[];

  setCurrentPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  updatePagination: (filteredArtifacts: ArtifactWithRelations[]) => void;
};

export const useArtifactPaginationStore = create<ArtifactPaginationStore>((set, get) => ({
  currentPage: 1,
  itemsPerPage: 6,
  totalPages: 0,
  paginatedArtifacts: [],

  setCurrentPage: (page) => {
    set({ currentPage: page });
    get().updatePagination(get().paginatedArtifacts);
  },
  setItemsPerPage: (itemsPerPage) => {
    set({ itemsPerPage });
    get().updatePagination(get().paginatedArtifacts);
  },
  updatePagination: (filteredArtifacts) => {
    const { currentPage, itemsPerPage } = get();
    const totalPages = Math.ceil(filteredArtifacts.length / itemsPerPage);
    const paginatedArtifacts = filteredArtifacts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    set({ totalPages, paginatedArtifacts });
  },
}));

// Listen for filteredArtifactsUpdated event
eventBus.on(FILTERED_ARTIFACTS_UPDATED, (filteredArtifacts: ArtifactWithRelations[]) => {
  useArtifactPaginationStore.getState().updatePagination(filteredArtifacts);
});