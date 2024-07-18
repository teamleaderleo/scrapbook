import { create } from 'zustand';
import { Tag } from '../definitions';
import { createTag, updateTag, deleteTag } from '../actions/tag-actions';
import { fetchAllTags } from '../data/tag-data';

interface TagStore {
  allTags: Tag[];
  setAllTags: (tags: Tag[]) => void;
  addTag: (accountId: string, name: string) => Promise<Tag>;
  updateTagName: (accountId: string, tagId: string, newName: string) => Promise<void>;
  removeTag: (accountId: string, tagId: string) => Promise<void>;
  fetchAllTags: (accountId: string) => Promise<void>;
  getOrCreateTags: (accountId: string, tagNames: string[]) => Promise<Tag[]>;
}

export const useTagStore = create<TagStore>((set, get) => ({
  allTags: [],
  setAllTags: (allTags) => set({ allTags }),
  addTag: async (accountId, name) => {
    const existingTag = get().allTags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
    if (existingTag) return existingTag;

    const newTag = await createTag(accountId, name);
    set((state) => ({ allTags: [...state.allTags, newTag] }));
    return newTag;
  },
  updateTagName: async (accountId, tagId, newName) => {
    const updatedTag = await updateTag(accountId, tagId, newName);
    set((state) => ({
      allTags: state.allTags.map((tag) => (tag.id === tagId ? updatedTag : tag)),
    }));
  },
  removeTag: async (accountId, tagId) => {
    await deleteTag(accountId, tagId);
    set((state) => ({
      allTags: state.allTags.filter((tag) => tag.id !== tagId),
    }));
  },
  fetchAllTags: async (accountId) => {
    const fetchedTags = await fetchAllTags(accountId);
    set({ allTags: fetchedTags });
  },
  getOrCreateTags: async (accountId, tagNames) => {
    const existingTags = get().allTags;
    const result: Tag[] = [];

    for (const name of tagNames) {
      const existingTag = existingTags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
      if (existingTag) {
        result.push(existingTag);
      } else {
        const newTag = await get().addTag(accountId, name);
        result.push(newTag);
      }
    }

    return result;
  },
}));