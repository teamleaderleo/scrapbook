'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchProjects } from '@/app/lib/data';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ProjectView, Tag } from '@/app/lib/definitions';
import { getArtifactThumbnail } from '@/app/lib/utils-client';
import { addTagToProject, removeTagFromProject } from '@/app/lib/utils-server';
import { useRouter } from 'next/navigation';

export default function ProjectsTable({
  initialProjects,
  query,
  currentPage,
}: {
  initialProjects: ProjectView[];
  query: string;
  currentPage: number;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const router = useRouter();

  const handleAddTag = async (projectId: string, tagName: string) => {
    const addedTag = await addTagToProject(ADMIN_UUID, projectId, tagName);
    if (addedTag) {
      setProjects(projects.map(project => 
        project.id === projectId 
          ? { ...project, tags: [...project.tags, addedTag] }
          : project
      ));
      router.refresh();
    }
  };

  const handleRemoveTag = async (projectId: string, tagId: string) => {
    await removeTagFromProject(ADMIN_UUID, projectId, tagId);
    setProjects(projects.map(project => 
      project.id === projectId 
        ? { ...project, tags: project.tags.filter(tag => tag.id !== tagId) }
        : project
    ));
    router.refresh();
  };

  return (
    <div className="mt-6 flow-root">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
            <table className="hidden min-w-full text-gray-900 md:table">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Name</th>
                  <th scope="col" className="px-3 py-5 font-medium">Description</th>
                  <th scope="col" className="px-3 py-5 font-medium">Status</th>
                  <th scope="col" className="px-3 py-5 font-medium">Tags</th>
                  <th scope="col" className="px-3 py-5 font-medium">Artifacts</th>
                  <th scope="col" className="px-3 py-5 font-medium">Updated</th>
                  <th scope="col" className="px-3 py-5 font-medium">Preview</th>
                  <th scope="col" className="relative py-3 pl-6 pr-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {projects.map((project: ProjectView) => (
                  <tr key={project.id} className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <p className="font-medium">{project.name}</p>
                    </td>
                    <td className="px-3 py-3">{project.description}</td>
                    <td className="whitespace-nowrap px-3 py-3">{project.status}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag: Tag) => (
                          <span key={tag.id} className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full flex items-center">
                            {tag.name}
                            <button
                              onClick={() => handleRemoveTag(project.id, tag.id)}
                              className="ml-1 text-xs text-blue-800 hover:text-blue-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <AddTagForm projectId={project.id} onAddTag={handleAddTag} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{project.artifacts.length}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex space-x-2">
                        {project.artifacts.slice(0, 3).map((artifact) => (
                          <div key={artifact.id} className="w-10 h-10 relative overflow-hidden rounded-full">
                            <Image
                              src={getArtifactThumbnail(artifact)}
                              alt={`Thumbnail for ${artifact.name}`}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end">
                        <Link
                          href={`/dashboard/projects/${project.id}/edit`}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTagForm({ projectId, onAddTag }: { projectId: string, onAddTag: (projectId: string, tagName: string) => void }) {
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(projectId, newTag.trim());
      setNewTag('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <input
        type="text"
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        placeholder="New tag"
        className="border rounded px-2 py-1 text-sm"
      />
      <button type="submit" className="ml-1 text-xs bg-blue-500 text-white px-2 py-1 rounded">Add</button>
    </form>
  );
}