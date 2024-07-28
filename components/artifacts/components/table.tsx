'use client';

import React, { useEffect } from 'react';
import { TagList } from '@/components/tags/taglist';
import { DeleteArtifact, UpdateArtifact } from '@/components/artifacts/components/button';
import Pagination from '../../ui/components/pagination';
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { ArtifactThumbnail } from './artifact-thumbnail';
import { ErrorBoundaryWithToast } from '../../errors/error-boundary';
import { Tag } from '@/app/lib/definitions/definitions';
import { ArtifactWithRelations } from "@/app/lib/definitions/artifact-definitions";
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
import { Suspense } from 'react';
import { SearchParamsHandler } from '../../search-params-handler';

export function ArtifactsTable({ accountId }: { accountId: string }) {
  const { 
    paginatedArtifacts,
    isLoading,
    error,
    updateArtifact,
    deleteArtifact,
    handleSearch,
    handlePageChange,
    currentPage,
    totalPages,
    updateArtifactTags,
  } = useArtifacts();

  const { showToast } = useToastMessages();

  const handleTagsChange = async (artifactId: string, newTags: string[]) => {
    await updateArtifactTags({ artifactId, tags: newTags });
  };

  const handleDeleteArtifact = async (id: string) => {
    try {
      await deleteArtifact(id);
      showToast('success', 'delete', 'artifact');
    } catch (error) {
      console.error('Failed to delete artifact:', error);
      showToast('error', 'delete', 'artifact');
    }
  };

  if (isLoading) return <div>Loading...</div>;
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
                  <th scope="col" className="px-3 py-5 font-medium">Type</th>
                  <th scope="col" className="px-3 py-5 font-medium">Description</th>
                  <th scope="col" className="px-3 py-5 font-medium">Tags</th>
                  <th scope="col" className="px-3 py-5 font-medium">Projects</th>
                  <th scope="col" className="px-3 py-5 font-medium">Updated</th>
                  <th scope="col" className="px-3 py-5 font-medium">Preview</th>
                  <th scope="col" className="relative py-3 pl-6 pr-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedArtifacts.map((artifact: ArtifactWithRelations) => (
                  <tr key={artifact.id} className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 relative overflow-hidden rounded-full">
                          <ErrorBoundaryWithToast>
                            <ArtifactThumbnail
                              artifact={artifact}
                              size={40}
                              priority={true}
                              className="flex-shrink-0"
                            />
                          </ErrorBoundaryWithToast> 
                        </div>
                        <div className="ml-4">
                          <p className="font-medium">{artifact.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {artifact.contents && artifact.contents.length > 0 ? artifact.contents[0].type : 'No content'}
                    </td>
                    <td className="px-3 py-3">{artifact.description}</td>
                    <td className="px-3 py-3">
                      <TagList
                        initialTags={artifact.tags.map(t => t.name)}
                        onTagsChange={(newTags) => handleTagsChange(artifact.id, newTags)}
                        accountId={accountId}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{artifact.projects.length}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {new Date(artifact.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex space-x-2">
                        {artifact.contents && artifact.contents.length > 0 ? (
                          artifact.contents.slice(0, 3).map((content, index) => (
                            <div key={index} className="w-10 h-10 relative overflow-hidden rounded-full">
                              <ErrorBoundaryWithToast> 
                                <ArtifactThumbnail
                                  artifact={artifact}
                                  size={40}
                                  priority={index < 5} // Prioritize loading for the first 5 images
                                  className="flex-shrink-0"
                                />
                              </ErrorBoundaryWithToast> 
                            </div>
                          ))
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full">
                            <span className="text-xs text-gray-500">No content</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end">
                        <UpdateArtifact artifact={artifact} />
                        <DeleteArtifact 
                          id={artifact.id} 
                          onDelete={() => handleDeleteArtifact(artifact.id)}  
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