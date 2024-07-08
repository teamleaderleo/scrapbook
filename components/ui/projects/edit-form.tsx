'use client';

import { ArtifactDetail, ProjectDetail } from '@/app/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { updateProject } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';

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

  return (
    <form action={formAction}>
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
          <label htmlFor="tags" className="mb-2 block text-sm font-medium">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            defaultValue={project.tags.map(tag => tag.name).join(', ')}
          />
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