'use client';

import { useCallback } from 'react';
import React, { useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArtifactWithRelations, Tag } from '@/app/lib/definitions';
import { getArtifactThumbnail } from '@/app/lib/utils-client';
import { TagList } from '@/components/ui/tags/taglist';
import { DeleteArtifact, UpdateArtifact } from '@/components/ui/artifacts/button';
import Pagination from '../pagination';
import { useArtifactStore } from '@/app/lib/store/artifact-store';
import { useTagStore } from '@/app/lib/store/tag-store';
import { ADMIN_UUID } from '@/app/lib/constants';

export const ARTIFACT_ITEMS_PER_PAGE = 6;

export function ArtifactsTable({
  initialArtifacts,
  accountId,
}: {
  initialArtifacts: ArtifactWithRelations[];
  accountId: string;
}) {
  const { artifacts, filteredArtifacts, setArtifacts, deleteArtifact, updateArtifactTags, searchArtifacts, currentPage, setCurrentPage, itemsPerPage } = useArtifactStore();
  const { allTags, ensureTagsExist } = useTagStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const query = searchParams.get('query') || '';

  useEffect(() => {
    setArtifacts(initialArtifacts);
  }, [initialArtifacts, setArtifacts]);

  useEffect(() => {
    searchArtifacts(query);
  }, [query, searchArtifacts]);

  useEffect(() => {
    const page = Number(searchParams.get('page')) || 1;
    setCurrentPage(page);
  }, [searchParams, setCurrentPage]);

  const paginatedArtifacts = useMemo(() => {
    return filteredArtifacts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredArtifacts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredArtifacts.length / itemsPerPage);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    
    // Update the URL without a page reload
    window.history.pushState({}, '', `${pathname}?${params.toString()}`);
  }, [searchParams, pathname, setCurrentPage]);

  const handleTagsChange = async (artifactId: string, newTags: Tag[]) => {
    const tagNames = newTags.map(tag => tag.name);
    const tags = await ensureTagsExist(ADMIN_UUID, tagNames);
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
                          <Image
                            src={getArtifactThumbnail(artifact)}
                            alt={`Thumbnail for ${artifact.name}`}
                            layout="fill"
                            objectFit="cover"
                            placeholder="blur"
                            blurDataURL="/placeholder-blur.jpg"  // Create a small, blurred version of your placeholder image
                          />
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
                              <Image
                                src={getArtifactThumbnail({ ...artifact, contents: [content] })}
                                alt={`Thumbnail for ${artifact.name} content ${index + 1}`}
                                layout="fill"
                                objectFit="cover"
                                placeholder="blur"
                                blurDataURL="/placeholder-blur.jpg"  // Create a small, blurred version of your placeholder image
                                priority={index === 0}  // Load the first image with priority
                              />
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
                        <DeleteArtifact id={artifact.id} onDelete={() => deleteArtifact(artifact.id)} />
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