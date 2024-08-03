import { create } from 'zustand'
import { ProjectWithBlocks } from "@/app/lib/definitions/definitions";

type ViewMode = 'chronological' | 'grid' | 'columns';

interface UIState {
  currentProject: ProjectWithBlocks | null;
  setCurrentProject: (project: ProjectWithBlocks | null) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedBlocks: string[];
  setSelectedBlocks: (blockIds: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  viewMode: 'chronological',
  setViewMode: (mode) => set({ viewMode: mode }),
  selectedBlocks: [],
  setSelectedBlocks: (blockIds) => set({ selectedBlocks: blockIds }),
}));