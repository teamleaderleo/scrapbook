import React, { useState, useEffect } from 'react';
import { Tag } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import { addTagToProject, removeTagFromProject, getProjectTags, getAllTags } from '@/app/lib/utils-server';
import { ADMIN_UUID } from '@/app/lib/constants';

interface TagManagerProps {
  entityId: string;
  initialTags: Tag[];
  entityType: 'project' | 'artifact';
  onTagsChange?: (tags: Tag[]) => void;
}

export default function TagManager({ entityId, initialTags, entityType, onTagsChange }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      const fetchedTags = entityType === 'project' 
        ? await getProjectTags(ADMIN_UUID, entityId)
        : []; // TODO: Implement getArtifactTags
      setTags(fetchedTags);
      
      const fetchedAllTags = await getAllTags(ADMIN_UUID);
      setAllTags(fetchedAllTags);
    };
    fetchTags();
  }, [entityId, entityType]);

  const handleAddTag = async (tagToAdd: string) => {
    if (tagToAdd.trim() !== '' && !tags.some(tag => tag.name.toLowerCase() === tagToAdd.trim().toLowerCase())) {
      const addTag = entityType === 'project' ? addTagToProject : () => {}; // TODO: Implement addTagToArtifact
      const addedTag = await addTag(ADMIN_UUID, entityId, tagToAdd.trim());
      if (addedTag) {
        const updatedTags = [...tags, addedTag];
        setTags(updatedTags);
        setNewTag('');
        onTagsChange?.(updatedTags);
      }
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    const removeTag = entityType === 'project' ? removeTagFromProject : () => {}; // TODO: Implement removeTagFromArtifact
    await removeTag(ADMIN_UUID, entityId, tagId);
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    setTags(updatedTags);
    onTagsChange?.(updatedTags);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag.id} className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-2 text-blue-800 hover:text-blue-900"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex mb-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="flex-grow peer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
          placeholder="Add a new tag"
        />
        <Button type="button" onClick={() => handleAddTag(newTag)} className="ml-2">
          Add Tag
        </Button>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Existing Tags:</h4>
        <div className="flex flex-wrap gap-2">
          {allTags
            .filter(tag => !tags.some(t => t.id === tag.id))
            .map(tag => (
              <button
                key={tag.id}
                onClick={() => handleAddTag(tag.name)}
                className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded hover:bg-gray-200"
              >
                {tag.name}
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
}