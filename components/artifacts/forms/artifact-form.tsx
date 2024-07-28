import React, { useState, useRef } from 'react';
import { ContentType, Tag } from '@/app/lib/definitions';
import { ArtifactWithRelations } from "@/app/lib/definitions/artifact-definitions";
import { BaseProject } from "@/app/lib/definitions/project-definitions";
import Link from 'next/link';
import { Button } from '@/components/ui/components/button';
import { TagManager } from '@/components/tags/tagmanager';
import { Suggestions } from '@/components/suggestions/suggestions';
import { useTags } from '@/app/lib/hooks/useTags';

interface ArtifactFormProps {
  artifact?: ArtifactWithRelations;
  projects: BaseProject[];
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
  submitButtonText: string;
  cancelHref: string;
  suggestedTags?: string[];
  suggestedContentExtensions?: string[];
  onGetAISuggestions?: () => void;
}

export function ArtifactForm({
  artifact,
  projects,
  onSubmit,
  isSubmitting,
  submitButtonText,
  cancelHref,
  suggestedTags = [],
  suggestedContentExtensions = [],
  onGetAISuggestions,
}: ArtifactFormProps) {
  const { tagNames, tagNamesToTags } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>(artifact?.tags.map(t => t.name) || []);
  const [contentItems, setContentItems] = useState<{id?: string, type: ContentType, content: string | File}[]>(
    (artifact?.contents && artifact.contents.length > 0)
      ? artifact.contents.map(c => ({id: c.id, type: c.type, content: c.content}))
      : [{type: 'text', content: ''}]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleAddSuggestedTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleAddContentExtension = (extension: string) => {
    setContentItems([...contentItems, { type: 'text', content: extension }]);
  };

  const handleAddContent = () => setContentItems([...contentItems, {type: 'text', content: ''}]);

  const handleContentTypeChange = (index: number, type: ContentType) => {
    const newContentItems = [...contentItems];
    newContentItems[index] = {type, content: ''};
    setContentItems(newContentItems);
  };

  const handleContentChange = (index: number, content: string | File) => {
    const newContentItems = [...contentItems];
    newContentItems[index].content = content;
    setContentItems(newContentItems);
  };

  const handleFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleContentChange(index, file);
  };

  const handleRemoveContent = (index: number) => {
    const newContentItems = [...contentItems];
    newContentItems.splice(index, 1);
    setContentItems(newContentItems);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      formData.delete('tags');
      selectedTags.forEach(tag => formData.append('tags', tag));
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <div>
        <div className="flex justify-between items-center mb-4">
          {/* <h1 className="text-2xl font-bold">{artifact ? 'Edit' : 'Create'} Artifact</h1> */}
          {onGetAISuggestions && (
            <Button onClick={onGetAISuggestions}>Get AI Suggestions</Button>
          )}
        </div>
        
        <div className="rounded-md bg-gray-50 p-4 md:p-6">
          {/* Artifact Name */}
          <div className="mb-4">
            <label htmlFor="name" className="mb-2 block text-sm font-medium">Artifact Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={artifact?.name}
              placeholder="Enter artifact name"
              required
            />
          </div>

          {/* Artifact Description */}
          <div className="mb-4">
            <label htmlFor="description" className="mb-2 block text-sm font-medium">Artifact Description</label>
            <textarea
              id="description"
              name="description"
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={artifact?.description}
              placeholder="Enter artifact description"
              rows={3}
            ></textarea>
          </div>

          {/* Artifact Content Items */}
          {contentItems.map((item, index) => (
            <div key={index} className="mb-4">
              <label className="mb-2 block text-sm font-medium">Content Item {index + 1}</label>
              <select
                name={`contentType-${index}`}
                className="mb-2 peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
                value={item.type}
                onChange={(e) => handleContentTypeChange(index, e.target.value as ContentType)}
                required
                title={`Content Type ${index + 1}`}
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="file">File</option>
              </select>
              {item.type === 'text' ? (
                <textarea
                  name={`content-${index}`}
                  className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
                  value={item.content as string}
                  onChange={(e) => handleContentChange(index, e.target.value)}
                  placeholder="Enter content"
                  required
                  rows={5}
                ></textarea>
              ) : (
                <div className="flex items-center">
                  <input
                    type="file"
                    name={`content-${index}`}
                    onChange={(e) => handleFileChange(index, e)}
                    accept={item.type === 'image' ? 'image/*' : undefined}
                    className="hidden"
                    required={!item.id}
                    ref={fileInputRef}
                    title="Choose File"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mr-2"
                  >
                    {item.id ? 'Change File' : 'Choose File'}
                  </Button>
                  <span className="text-sm text-gray-500">
                    {item.content instanceof File ? item.content.name : (item.id ? 'Existing file' : 'No file chosen')}
                  </span>
                </div>
              )}
              {item.id && (
                <input type="hidden" name={`contentId-${index}`} value={item.id} />
              )}
              <Button type="button" onClick={() => handleRemoveContent(index)} className="mt-2">
                Remove Content
              </Button>
            </div>
          ))}
          <Button type="button" onClick={handleAddContent}>Add Content Item</Button>

          {/* Associated Projects */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Associated Projects</label>
            {projects.map((project) => (
              <div key={project.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`project-${project.id}`}
                  name="projects"
                  value={project.id}
                  defaultChecked={artifact?.projects?.some(p => p.id === project.id) || false}
                  className="mr-2"
                />
                <label htmlFor={`project-${project.id}`} className="text-sm">{project.name}</label>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Tags</label>
            <TagManager
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              allTags={tagNames}
            />
          </div>

          {/* Suggestions */}
          <Suggestions
            suggestedTags={suggestedTags}
            suggestedContentExtensions={suggestedContentExtensions}
            onAddTag={handleAddSuggestedTag}
            onAddContentExtension={handleAddContentExtension}
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