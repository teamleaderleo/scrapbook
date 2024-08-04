import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ProjectWithBlocks } from "@/app/lib/definitions/definitions";
import { JSONContent } from '@tiptap/react';

type ViewMode = 'chronological' | 'grid' | 'columns';

interface DraftMap {
  [projectId: string]: JSONContent;
}

interface UIState {
  currentProject: ProjectWithBlocks | null;
  setCurrentProject: (project: ProjectWithBlocks | null) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedBlocks: string[];
  setSelectedBlocks: (blockIds: string[]) => void;
}

interface DraftState {
  drafts: DraftMap;
  saveDraft: (content: JSONContent) => void;
  getDraft: (projectId: string) => JSONContent | null;
  clearDraft: (projectId: string) => void;
}

const useUIStore = create<UIState>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  viewMode: 'chronological',
  setViewMode: (mode) => set({ viewMode: mode }),
  selectedBlocks: [],
  setSelectedBlocks: (blockIds) => set({ selectedBlocks: blockIds }),
}));

const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: {},
      saveDraft: (content: JSONContent) => {
        const currentProject = useUIStore.getState().currentProject;
        if (currentProject) {
          set((state) => ({
            drafts: {
              ...state.drafts,
              [currentProject.id]: content,
            },
          }));
          console.log(`Saved draft for project: ${currentProject.id}`);
        } else {
          console.warn('Attempted to save draft, but no current project is set');
        }
      },
      getDraft: (projectId) => get().drafts[projectId] || null,
      clearDraft: (projectId) => set((state) => {
        const { [projectId]: _, ...rest } = state.drafts;
        return { drafts: rest };
      }),
    }),
    {
      name: 'draft-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { useUIStore, useDraftStore };