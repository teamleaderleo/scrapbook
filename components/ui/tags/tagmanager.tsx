import React, { useState } from 'react';
import { useTags } from '@/app/lib/hooks/useTags';
import { Tag } from '@/app/lib/definitions';

interface TagManagerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
}

export function TagManager({ selectedTags, onTagsChange, allTags }: TagManagerProps) {
  const { addTag } = useTags();
  const [newTag, setNewTag] = useState('');

  const handleAddTag = async () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      const createdTag = await addTag(trimmedTag);
      const updatedTags = [...selectedTags, createdTag.name];
      onTagsChange(updatedTags);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(updatedTags);
  };

  const handleSelectTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
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
          .filter(tag => !selectedTags.includes(tag))
          .map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))
        }
      </select>
      <div className="mt-2">
        {selectedTags.map((tag) => (
          <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
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