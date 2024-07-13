import React, { useState, useEffect } from 'react';
import { Tag } from '@/app/lib/definitions';
import { useTagStore } from '@/app/lib/store/tag-store';
import { ADMIN_UUID } from '@/app/lib/constants';

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagManager({ tags, onTagsChange }: TagManagerProps) {
  const { allTags, fetchAllTags, addTag } = useTagStore();
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchAllTags(ADMIN_UUID);
  }, [fetchAllTags]);

  const handleAddTag = async () => {
    if (newTag && !tags.includes(newTag)) {
      const existingTag = allTags.find(tag => tag.name.toLowerCase() === newTag.toLowerCase());
      if (existingTag) {
        onTagsChange([...tags, existingTag.name]);
      } else {
        const createdTag = await addTag(ADMIN_UUID, newTag);
        onTagsChange([...tags, createdTag.name]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSelectTag = (tagName: string) => {
    if (!tags.includes(tagName)) {
      onTagsChange([...tags, tagName]);
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
          .filter(tag => !tags.includes(tag.name))
          .map(tag => (
            <option key={tag.id} value={tag.name}>{tag.name}</option>
          ))
        }
      </select>
      <div className="mt-2">
        {tags.map((tag, index) => (
          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
            {tag}
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