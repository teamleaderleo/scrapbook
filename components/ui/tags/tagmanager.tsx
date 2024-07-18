import React, { useState } from 'react';
import { Tag } from '@/app/lib/definitions';
import { useTagStore } from '@/app/lib/store/tag-store';
import { ADMIN_UUID } from '@/app/lib/constants';

interface TagManagerProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  allTags: Tag[];
}

export function TagManager({ selectedTags, onTagsChange, allTags }: TagManagerProps) {
  const { addTag } = useTagStore();
  const [newTag, setNewTag] = useState('');

  const handleAddTag = async () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag) {
      const existingTag = allTags.find(tag => tag.name.toLowerCase() === trimmedTag.toLowerCase());
      
      if (existingTag) {
        if (!selectedTags.some(tag => tag.id === existingTag.id)) {
          onTagsChange([...selectedTags, existingTag]);
        }
      } else {
        const createdTag = await addTag(ADMIN_UUID, trimmedTag);
        onTagsChange([...selectedTags, createdTag]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
  };

  const handleSelectTag = (tagId: string) => {
    const tagToAdd = allTags.find(tag => tag.id === tagId);
    if (tagToAdd && !selectedTags.some(tag => tag.id === tagToAdd.id)) {
      onTagsChange([...selectedTags, tagToAdd]);
    }
  };

  return (
    <div>
      <div className="flex mb-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="flex-grow border rounded-l px-2 py-1 text-sm"
          placeholder="Add a new tag"
        />
        <button
          type="button"
          onClick={handleAddTag}
          className="bg-blue-500 text-white px-3 py-1 rounded-r text-sm"
        >
          Add
        </button>
      </div>
      <select
        onChange={(e) => handleSelectTag(e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm"
        value=""
        title="Select an existing tag"
      >
        <option value="" disabled>Select an existing tag</option>
        {allTags
          .filter(tag => !selectedTags.some(selectedTag => selectedTag.id === tag.id))
          .map(tag => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))
        }
      </select>
      <div className="mt-2">
        {selectedTags.map((tag) => (
          <span key={tag.id} className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 text-xs text-blue-800 hover:text-blue-900"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}