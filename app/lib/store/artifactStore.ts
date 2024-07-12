import { create } from 'zustand';
import { ArtifactView } from '@/app/lib/definitions';

type ArtifactStore = {
  artifacts: ArtifactView[];
  setArtifacts: (artifacts: ArtifactView[]) => void;
  updateArtifact: (updatedArtifact: ArtifactView) => void;
  deleteArtifact: (id: string) => void;
  addArtifact: (newArtifact: ArtifactView) => void;
};

export const useArtifactStore = create<ArtifactStore>((set) => ({
  artifacts: [],
  setArtifacts: (artifacts) => set({ artifacts }),
  updateArtifact: (updatedArtifact) =>
    set((state) => ({
      artifacts: state.artifacts.map((a) =>
        a.id === updatedArtifact.id ? updatedArtifact : a
      ),
    })),
  deleteArtifact: (id) =>
    set((state) => ({
      artifacts: state.artifacts.filter((a) => a.id !== id),
    })),
  addArtifact: (newArtifact) =>
    set((state) => ({
      artifacts: [...state.artifacts, newArtifact],
    })),
}));