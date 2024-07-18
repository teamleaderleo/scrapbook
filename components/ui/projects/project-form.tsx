import React, { useState } from 'react';
import { ArtifactWithRelations, ProjectWithRelations, Tag } from '@/app/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TagManager } from '@/components/ui/tags/tagmanager';
import { Suggestions } from '@/components/ui/suggestions/suggestions';

interface ProjectFormProps {
  project: ProjectWithRelations;
  artifacts: ArtifactWithRelations[];
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
  submitButtonText: string;
  cancelHref: string;
  suggestedTags?: string[];
  onGetAISuggestions?: () => void;
  allTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export function ProjectForm({
  project,
  artifacts,
  onSubmit,
  isSubmitting,
  submitButtonText,
  cancelHref,
  suggestedTags = [],
  onGetAISuggestions,
  allTags,
  onTagsChange,
}: ProjectFormProps) {
  const [tags, setTags] = useState<Tag[]>(project.tags);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    tags.forEach(tag => formData.append('tags', tag.id));
    onSubmit(formData);
  };

  const handleAddSuggestedTag = (tagName: string) => {
    const existingTag = allTags.find(t => t.name === tagName);
    if (existingTag && !tags.some(t => t.id === existingTag.id)) {
      const newTags = [...tags, existingTag];
      setTags(newTags);
      onTagsChange(newTags);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <div className="flex justify-between items-center mb-4">
          {onGetAISuggestions && (
            <Button onClick={onGetAISuggestions}>Get AI Suggestions</Button>
          )}
        </div>
        
        <div className="rounded-md bg-gray-50 p-4 md:p-6">
          {/* Project Name */}
          <div className="mb-4">
            <label htmlFor="name" className="mb-2 block text-sm font-medium">Project Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={project.name}
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Project Description */}
          <div className="mb-4">
            <label htmlFor="description" className="mb-2 block text-sm font-medium">Project Description</label>
            <textarea
              id="description"
              name="description"
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={project.description}
              placeholder="Enter project description"
              rows={3}
            ></textarea>
          </div>

          {/* Project Status */}
          <div className="mb-4">
            <label htmlFor="status" className="mb-2 block text-sm font-medium">Project Status</label>
            <select
              id="status"
              name="status"
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={project.status}
              required
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Associated Artifacts */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Associated Artifacts</label>
            {artifacts.map((artifact) => (
              <div key={artifact.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`artifact-${artifact.id}`}
                  name="artifacts"
                  value={artifact.id}
                  defaultChecked={project.artifacts?.some(a => a.id === artifact.id) || false}
                  className="mr-2"
                />
                <label htmlFor={`artifact-${artifact.id}`} className="text-sm">{artifact.name}</label>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Tags</label>
            <TagManager
              selectedTags={tags}
              onTagsChange={(newTags) => {
                setTags(newTags);
                onTagsChange(newTags);
              }}
              allTags={allTags}
            />
          </div>

          {/* Suggestions */}
          <Suggestions
            suggestedTags={suggestedTags}
            onAddTag={handleAddSuggestedTag}
          />

        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link
            href={cancelHref}
            className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Cancel
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitButtonText}
          </Button>
        </div>
      </div>
    </form>
  );
}