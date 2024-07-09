'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArtifactDetail, Tag } from '@/app/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createProject, State } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { TagList } from '@/components/taglist';

export default function Form({ artifacts }: { artifacts: ArtifactDetail[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialState: State = { message: null, errors: {} };
  const createProjectWithAccount = createProject.bind(null, ADMIN_UUID);
  const [state, formAction] = useFormState(createProjectWithAccount, initialState);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (state.message === 'Project created successfully') {
      setIsSubmitting(false);
      setTimeout(() => router.push('/dashboard/projects'), 2000);
    } else if (state.message) {
      setIsSubmitting(false);
    }
  }, [state, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    tags.forEach(tag => formData.append('tags', tag));
    formAction(formData);
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
            placeholder="Enter project name"
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
            placeholder="Enter project description"
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
            {tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 text-xs">×</button>
              </span>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-grow border rounded-l px-2 py-1 text-sm"
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="bg-blue-500 text-white px-3 py-1 rounded-r text-sm"
            >
              Add
            </button>
          </div>
        </div>

        {state.message && (
          <p className={`mt-2 text-sm ${state.message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {state.message}
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/projects"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}