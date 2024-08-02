import { create } from 'zustand'
import { ProjectWithBlocks } from "@/app/lib/definitions/definitions";

type ViewMode = 'chronological' | 'grid' | 'columns';

export const useUIStore = create((set) => ({
  currentProject: null,
  setCurrentProject: (project: ProjectWithBlocks | null) => set({ currentProject: project }),
  viewMode: 'chronological',
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  selectedBlocks: [],
  setSelectedBlocks: (blockIds: any) => set({ selectedBlocks: blockIds }),
}));
