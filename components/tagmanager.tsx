import React, { useState, useEffect } from 'react';
import { Tag } from '@/app/lib/definitions';
import { getAllTags } from '@/app/lib/utils-server';
import { ADMIN_UUID } from '@/app/lib/constants';

interface TagManagerProps {
  initialTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagManager({ initialTags, onTagsChange }: TagManagerProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    async function fetchAllTags() {
      const fetchedTags = await getAllTags(ADMIN_UUID);
      setAllTags(fetchedTags);
    }
    fetchAllTags();
  }, []);

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      onTagsChange(updatedTags);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    onTagsChange(updatedTags);
  };

  const handleSelectTag = (tagName: string) => {
    if (!tags.includes(tagName)) {
      const updatedTags = [...tags, tagName];
      setTags(updatedTags);
      onTagsChange(updatedTags);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {tag}
            <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 text-xs">×</button>
          </span>
        ))}
      </div>
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
    </div>
  );
}