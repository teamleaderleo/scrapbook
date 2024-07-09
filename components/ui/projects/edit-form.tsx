'use client';

import React, { useEffect, useState } from 'react';
import { ArtifactDetail, ProjectDetail, Tag } from '@/app/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { updateProject } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { addTagToProject, getProjectTags, removeTagFromProject } from '@/app/lib/utils-server';

export default function EditProjectForm({
  project,
  artifacts,
}: {
  project: ProjectDetail;
  artifacts: ArtifactDetail[];
}) {
  const initialState = { message: null, errors: {} };
  const updateProjectWithId = updateProject.bind(null, project.id, ADMIN_UUID);
  const [state, formAction] = useFormState(updateProjectWithId, initialState);

  const [tags, setTags] = useState<Tag[]>(project.tags || []);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      const projectTags = await getProjectTags(ADMIN_UUID, project.id);
      setTags(projectTags);
    };
    fetchTags();
  }, [project.id]);

  const handleAddTag = async () => {
    if (newTag.trim() !== '' && !tags.some(tag => tag.name === newTag.trim())) {
      const addedTag = await addTagToProject(ADMIN_UUID, project.id, newTag.trim());
      if (addedTag) {
        setTags([...tags, addedTag]);
        setNewTag('');
      }
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTagFromProject(ADMIN_UUID, project.id, tagId);
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    tags.forEach(tag => formData.append('tags', tag.name));
    formAction(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Project Name */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Project Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            defaultValue={project.name}
            required
          />
        </div>

        {/* Project Description */}
        <div className="mb-4">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Project Description
          </label>
          <textarea
            id="description"
            name="description"
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            defaultValue={project.description}
          ></textarea>
        </div>

        {/* Project Status */}
        <div className="mb-4">
          <label htmlFor="status" className="mb-2 block text-sm font-medium">
            Project Status
          </label>
          <select
            id="status"
            name="status"
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            defaultValue={project.status}
            required
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Artifacts */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Associated Artifacts
          </label>
          {artifacts.map((artifact) => (
            <div key={artifact.id} className="flex items-center">
              <input
                type="checkbox"
                id={`artifact-${artifact.id}`}
                name="artifacts"
                value={artifact.id}
                defaultChecked={project.artifacts?.some(a => a.id === artifact.id) || false}
                className="mr-2"
              />
              <label htmlFor={`artifact-${artifact.id}`}>{artifact.name}</label>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Tags
          </label>
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
          <div className="flex">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-grow peer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              placeholder="Add a new tag"
            />
            <Button type="button" onClick={handleAddTag} className="ml-2">
              Add Tag
            </Button>
          </div>
        </div>

        {state.message && (
          <p className="mt-2 text-sm text-red-500">{state.message}</p>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/projects"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Update Project</Button>
      </div>
    </form>
  );
}