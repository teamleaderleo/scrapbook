import { create } from 'zustand';
import { Tag } from '../definitions';
import { createTag, updateTag, deleteTag, getAllTags } from '../actions/tag-actions';

interface TagStore {
  allTags: Tag[];
  setAllTags: (tags: Tag[]) => void;
  addTag: (accountId: string, name: string) => Promise<Tag>;
  updateTagName: (accountId: string, tagId: string, newName: string) => Promise<void>;
  removeTag: (accountId: string, tagId: string) => Promise<void>;
  fetchAllTags: (accountId: string) => Promise<void>;
  ensureTagsExist: (accountId: string, tagNames: string[]) => Promise<Tag[]>;
}

export const useTagStore = create<TagStore>((set, get) => ({
  allTags: [],
  setAllTags: (allTags) => set({ allTags }),
  addTag: async (accountId, name) => {
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
    const fetchedTags = await getAllTags(accountId);
    set({ allTags: fetchedTags });
  },
  ensureTagsExist: async (accountId, tagNames) => {
    const existingTags = get().allTags;
    const newTags = tagNames.filter(name => !existingTags.some(tag => tag.name === name));
    const createdTags = await Promise.all(newTags.map(name => get().addTag(accountId, name)));
    return [...existingTags.filter(tag => tagNames.includes(tag.name)), ...createdTags];
  },
}));