import { create } from 'zustand';
import { Tag } from '../definitions';
import { createTag, updateTag, deleteTag, getAllTags } from '../actions/tag-actions';

interface TagStore {
  tags: Tag[];
  allTags: Tag[];
  setTags: (tags: Tag[]) => void;
  setAllTags: (tags: Tag[]) => void;
  addTag: (accountId: string, name: string) => Promise<Tag>;
  updateTagName: (accountId: string, tagId: string, newName: string) => Promise<void>;
  removeTag: (accountId: string, tagId: string) => Promise<void>;
  fetchTags: (accountId: string) => Promise<void>;
  fetchAllTags: (accountId: string) => Promise<void>;
}

export const useTagStore = create<TagStore>((set) => ({
  tags: [],
  allTags: [],
  setTags: (tags) => set({ tags }),
  setAllTags: (allTags) => set({ allTags }),
  addTag: async (accountId, name) => {
    const newTag = await createTag(accountId, name);
    set((state) => ({ 
      tags: [...state.tags, newTag],
      allTags: [...state.allTags, newTag]
    }));
    return newTag;
  },
  updateTagName: async (accountId, tagId, newName) => {
    const updatedTag = await updateTag(accountId, tagId, newName);
    set((state) => ({
      tags: state.tags.map((tag) => (tag.id === tagId ? updatedTag : tag)),
      allTags: state.allTags.map((tag) => (tag.id === tagId ? updatedTag : tag)),
    }));
  },
  removeTag: async (accountId, tagId) => {
    await deleteTag(accountId, tagId);
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== tagId),
      allTags: state.allTags.filter((tag) => tag.id !== tagId),
    }));
  },
  fetchTags: async (accountId) => {
    const fetchedTags = await getAllTags(accountId);
    set({ tags: fetchedTags });
  },
  fetchAllTags: async (accountId) => {
    const fetchedTags = await getAllTags(accountId);
    set({ allTags: fetchedTags });
  },
}));