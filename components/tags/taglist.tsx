import React, { useState, useEffect } from 'react';
import { useTags } from '@/app/lib/hooks/useTags';

interface TagListProps {
  initialTags: string[];
  onTagsChange: (tags: string[]) => void;
  accountId: string;
}

export function TagList({ initialTags, onTagsChange, accountId }: TagListProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [showAddForm, setShowAddForm] = useState(false);
  const { tagNames, addTag } = useTags();

  const handleAddTag = async (tagName: string) => {
    if (!tags.includes(tagName.toLowerCase())) {
      await addTag(tagName);
      const updatedTags = [...tags, tagName];
      setTags(updatedTags);
      onTagsChange(updatedTags);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    onTagsChange(updatedTags);
  };

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {tags.map((tag) => (
        <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full flex items-center">
          {tag}
          <button
            onClick={() => handleRemoveTag(tag)}
            className="ml-1 text-xs text-blue-800 hover:text-blue-900"
          >
            ×
          </button>
        </span>
      ))}
      {showAddForm ? (
        <AddTagForm
          existingTags={tagNames.filter(tag => !tags.includes(tag.toLowerCase()))}
          onAddTag={handleAddTag}
          onClose={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          + Add Tag
        </button>
      )}
    </div>
  );
}

interface AddTagFormProps {
  existingTags: string[];
  onAddTag: (tagName: string) => void;
  onClose: () => void;
}

function AddTagForm({ existingTags, onAddTag, onClose }: AddTagFormProps) {
  const [newTag, setNewTag] = useState('');
  const filteredTags = existingTags.filter(tag => 
    tag.toLowerCase().includes(newTag.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-start">
      <div className="flex items-center">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="New tag"
          className="border rounded px-2 py-1 text-sm"
        />
        <button type="submit" className="ml-1 text-xs bg-blue-500 text-white px-2 py-1 rounded">Add</button>
        <button type="button" onClick={onClose} className="ml-1 text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">Cancel</button>
      </div>
      {filteredTags.length > 0 && (
        <ul className="mt-2 max-h-32 overflow-y-auto">
          {filteredTags.map(tag => (
            <li 
              key={tag} 
              className="cursor-pointer hover:bg-gray-100 p-1"
              onClick={() => {
                onAddTag(tag);
                onClose();
              }}
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}