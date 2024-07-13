import { create } from 'zustand';
import { ArtifactView } from '@/app/lib/definitions';
import { createArtifact, updateArtifact, deleteArtifact } from '@/app/lib/artifact-actions';
import { ADMIN_UUID } from '@/app/lib/constants';

type ArtifactStore = {
  artifacts: ArtifactView[];
  setArtifacts: (artifacts: ArtifactView[]) => void;
  updateArtifact: (id: string, formData: FormData) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
  addArtifact: (formData: FormData) => Promise<void>;
};

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  artifacts: [],
  setArtifacts: (artifacts) => set({ artifacts }),
  updateArtifact: async (id, formData) => {
    const result = await updateArtifact(id, ADMIN_UUID, {}, formData);
    if (result.message === 'Artifact updated successfully') {
      // Assuming you have a function to fetch a single artifact
      const updatedArtifact = await fetchSingleArtifact(ADMIN_UUID, id);
      set((state) => ({
        artifacts: state.artifacts.map((a) => a.id === id ? updatedArtifact : a),
      }));
    }
  },
  deleteArtifact: async (id) => {
    const result = await deleteArtifact(id, ADMIN_UUID);
    if (result.success) {
      set((state) => ({
        artifacts: state.artifacts.filter((a) => a.id !== id),
      }));
    }
  },
  addArtifact: async (formData) => {
    const result = await createArtifact(ADMIN_UUID, formData);
    if (result.artifactId) {
      // Assuming you have a function to fetch a single artifact
      const newArtifact = await fetchSingleArtifact(ADMIN_UUID, result.artifactId);
      set((state) => ({
        artifacts: [...state.artifacts, newArtifact],
      }));
    }
  },
}));