import create from 'zustand';
import { Tag } from '@/app/lib/definitions';

interface TagState {
  tags: Tag[];
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  setTags: (tags: Tag[]) => void;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
  removeTag: (tagId) => set((state) => ({ tags: state.tags.filter(t => t.id !== tagId) })),
  setTags: (tags) => set({ tags }),
}));