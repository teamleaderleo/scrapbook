'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArtifactWithRelations, Tag } from '@/app/lib/definitions';
import { TagList } from '@/components/ui/tags/taglist';
import { DeleteArtifact, UpdateArtifact } from '@/components/ui/artifacts/button';
import Pagination from '../pagination';
import { useArtifactQueries } from '@/app/lib/store/artifacts/use-artifact-queries';
import { useTagStore } from '@/app/lib/store/tag-store';
import { ArtifactThumbnail } from './artifact-thumbnail';
import { ErrorBoundaryWithToast } from '../errors/error-boundary';

export const ARTIFACT_ITEMS_PER_PAGE = 6;

export function ArtifactsTable({ accountId }: { accountId: string }) {
  const { 
    queryArtifacts,
    isLoading,
    error,
    updateArtifact,
    deleteArtifact,
    handleSearch,
    handlePageChange,
    filteredArtifacts,
    currentPage,
    totalPages,
    updateArtifactTags,
    preloadAdjacentPages,
  } = useArtifactQueries();

  const { allTags, ensureTagsExist } = useTagStore();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    preloadAdjacentPages();
  }, [preloadAdjacentPages]);

  useEffect(() => {
    const query = searchParams.get('query') || '';
    const page = Number(searchParams.get('page')) || 1;
    handleSearch(query);
    handlePageChange(page);
  }, [searchParams, handleSearch, handlePageChange]);

  const handleTagsChange = async (artifactId: string, newTags: Tag[]) => {
    const tagNames = newTags.map(tag => tag.name);
    const tags = await ensureTagsExist(accountId, tagNames);
    await updateArtifactTags(artifactId, tags);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else if (event.key === 'ArrowRight' && currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, handlePageChange]);

  const paginatedArtifacts = filteredArtifacts.slice(
    (currentPage - 1) * ARTIFACT_ITEMS_PER_PAGE,
    currentPage * ARTIFACT_ITEMS_PER_PAGE
  );


  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="mt-6 flow-root">
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
                        artifactId={artifact.id}
                        initialTags={artifact.tags}
                        allTags={allTags}
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
                          onDelete={() => deleteArtifact(artifact.id)} 
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