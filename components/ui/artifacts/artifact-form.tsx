import React, { useState } from 'react';
import { ArtifactDetail, Project, Tag, ContentType } from '@/app/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TagManager } from '@/components/tagmanager';

interface ArtifactFormProps {
  artifact?: ArtifactDetail;
  projects: Project[];
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
  submitButtonText: string;
  cancelHref: string;
}

export function ArtifactForm({
  artifact,
  projects,
  onSubmit,
  isSubmitting,
  submitButtonText,
  cancelHref,
}: ArtifactFormProps) {
  const [tags, setTags] = useState<string[]>(artifact?.tags.map(tag => tag.name) || []);
  const [artifactType, setArtifactType] = useState<ContentType>(artifact?.contents[0]?.type || 'text');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    tags.forEach(tag => formData.append('tags', tag));
    formData.append('type', artifactType);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Artifact Name */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Artifact Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            defaultValue={artifact?.name}
            placeholder="Enter artifact name"
            required
          />
        </div>

        {/* Artifact Description */}
        <div className="mb-4">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Artifact Description
          </label>
          <textarea
            id="description"
            name="description"
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            defaultValue={artifact?.description}
            placeholder="Enter artifact description"
          ></textarea>
        </div>

        {/* Artifact Type */}
        <div className="mb-4">
          <label htmlFor="type" className="mb-2 block text-sm font-medium">
            Artifact Type
          </label>
          <select
            id="type"
            name="type"
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            value={artifactType}
            onChange={(e) => setArtifactType(e.target.value as ContentType)}
            required
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="file">File</option>
          </select>
        </div>

        {/* Artifact Content */}
        <div className="mb-4">
          <label htmlFor="content" className="mb-2 block text-sm font-medium">
            Artifact Content
          </label>
          {artifactType === 'text' && (
            <textarea
              id="content"
              name="content"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={artifact?.contents[0]?.content}
              placeholder="Enter artifact content"
              required
            ></textarea>
          )}
          {artifactType === 'image' && (
            <input
              type="file"
              id="content"
              name="content"
              accept="image/*"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              required
            />
          )}
          {artifactType === 'file' && (
            <input
              type="file"
              id="content"
              name="content"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              required
            />
          )}
        </div>

        {/* Associated Projects */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Associated Projects
          </label>
          {projects.map((project) => (
            <div key={project.id} className="flex items-center">
              <input
                type="checkbox"
                id={`project-${project.id}`}
                name="projects"
                value={project.id}
                defaultChecked={artifact?.projects?.some(p => p.id === project.id) || false}
                className="mr-2"
              />
              <label htmlFor={`project-${project.id}`}>{project.name}</label>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Tags
          </label>
          <TagManager initialTags={tags} onTagsChange={setTags} />
        </div>
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
    </form>
  );
}