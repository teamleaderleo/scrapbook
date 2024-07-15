import { create } from 'zustand';
import { ArtifactWithRelations } from '@/app/lib/definitions';

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

  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }),
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