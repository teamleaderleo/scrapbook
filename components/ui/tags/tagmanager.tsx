import React, { useState, useEffect } from 'react';
import { Tag } from '@/app/lib/definitions';
import { getAllTags } from '@/app/lib/actions/tag-actions';
import { ADMIN_UUID } from '@/app/lib/constants';

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagManager({ tags, onTagsChange }: TagManagerProps) {
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
      onTagsChange([...tags, newTag]);
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
    </div>
  );
}