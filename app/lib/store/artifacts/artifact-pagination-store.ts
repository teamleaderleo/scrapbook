import { create } from 'zustand';
import { ArtifactWithRelations } from '@/app/lib/definitions';
import { eventBus, FILTERED_ARTIFACTS_UPDATED } from '../../event-bus';

type ArtifactPaginationStore = {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;

  setCurrentPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  updatePagination: (filteredArtifacts: ArtifactWithRelations[]) => void;
};

export const useArtifactPaginationStore = create<ArtifactPaginationStore>((set, get) => ({
  currentPage: 1,
  itemsPerPage: 6,
  totalPages: 0,

  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }),
  updatePagination: (filteredArtifacts) => {
    const { itemsPerPage } = get();
    const totalPages = Math.ceil(filteredArtifacts.length / itemsPerPage);
    set({ totalPages });
  },
}));

eventBus.on(FILTERED_ARTIFACTS_UPDATED, (filteredArtifacts: ArtifactWithRelations[]) => {
  useArtifactPaginationStore.getState().updatePagination(filteredArtifacts);
});