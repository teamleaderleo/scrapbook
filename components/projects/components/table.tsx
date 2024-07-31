'use client';

import React, { useEffect } from 'react';
import { TagList } from '@/components/tags/taglist';
import { DeleteProject, UpdateProject } from '@/components/projects/components/button';
import Pagination from '../../ui/components/pagination';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { ErrorBoundaryWithToast } from '../../errors/error-boundary';
import { Artifact, ProjectWithArtifacts } from "@/app/lib/definitions/definitions";
import { ArtifactThumbnail } from '../../blocks/components/block-thumbnail';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
import { Suspense } from 'react';
import { SearchParamsHandler } from '../../search-params-handler';
import { ProjectsTableSkeleton } from '@/components/ui/components/skeletons';

export function ProjectsTable({ accountId }: { accountId: string }) {
  const { 
    paginatedProjects,
    isLoading,
    error,
    updateProject,
    deleteProject,
    handleSearch,
    handlePageChange,
    currentPage,
    totalPages,
    updateProjectTags,
  } = useProjects();

  const { showToast } = useToastMessages();

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      showToast('success', 'delete', 'project');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showToast('error', 'delete', 'project');
    }
  };

  const handleTagsChange = async (projectId: string, newTagNames: string[]) => {
    await updateProjectTags({ projectId, tags: newTagNames });
  };

  if (isLoading) return <ProjectsTableSkeleton />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="mt-6 flow-root">
      <Suspense fallback={null}>
        <SearchParamsHandler
          onSearchChange={handleSearch}
          onPageChange={handlePageChange}
        />
      </Suspense>
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
                {paginatedProjects.map((project: ProjectWithArtifacts) => (
                  <tr key={project.id} className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <p className="font-medium">{project.name}</p>
                    </td>
                    <td className="px-3 py-3">{project.description}</td>
                    <td className="whitespace-nowrap px-3 py-3">{project.status}</td>
                    <td className="px-3 py-3">
                      <TagList
                        initialTags={project.tags?.map(t => t.name) || []}
                        onTagsChange={(newTags) => handleTagsChange(project.id, newTags)}
                        accountId={accountId}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{project.blocks?.length}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex space-x-2">
                        {project.blocks && project.blocks.length > 0 && (
                          <div key={project.blocks[0].id} className="w-10 h-10 relative overflow-hidden rounded-full">
                            <ErrorBoundaryWithToast>
                              {project.blocks[0] && (
                                <ArtifactThumbnail
                                  block={project.blocks[0] as Artifact}
                                  size={40}
                                  priority={true}
                                  className="flex-shrink-0"
                                />
                              )}
                            </ErrorBoundaryWithToast>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end">
                        <UpdateProject id={project.id} />
                        <DeleteProject 
                          id={project.id} 
                          onDelete={() => handleDeleteProject(project.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-5 flex w-full justify-center">
        <Pagination 
          totalPages={totalPages} 
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}