'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArtifactWithRelations } from '@/app/lib/definitions';
import { getArtifactThumbnail } from '@/app/lib/utils-client';
import { TagList } from '@/components/ui/tags/taglist';
import { DeleteArtifact, UpdateArtifact } from '@/components/ui/artifacts/button';
import { TagProvider } from '@/components/ui/tags/tagcontext';
import Pagination from '../pagination';
import { useArtifactStore } from '@/app/lib/store/artifact-store';

export const ARTIFACT_ITEMS_PER_PAGE = 6;

export function ArtifactsTable({
  initialArtifacts,
}: {
  initialArtifacts: ArtifactWithRelations[];
}) {
  const { artifacts, setArtifacts, deleteArtifact } = useArtifactStore();
  const [filteredArtifacts, setFilteredArtifacts] = useState(initialArtifacts);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const query = searchParams.get('query') || '';

  useEffect(() => {
    setArtifacts(initialArtifacts);
  }, [initialArtifacts, setArtifacts]);

  useEffect(() => {
    const filtered = artifacts.filter(artifact => 
      artifact.name.toLowerCase().includes(query.toLowerCase()) ||
      (artifact.description && artifact.description.toLowerCase().includes(query.toLowerCase())) ||
      artifact.tags.some(tag => tag.name.toLowerCase().includes(query.toLowerCase())) ||
      artifact.contents.some(content => content.content.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredArtifacts(filtered);
  }, [query, artifacts]);

  const paginatedArtifacts = filteredArtifacts.slice(
    (currentPage - 1) * ARTIFACT_ITEMS_PER_PAGE,
    currentPage * ARTIFACT_ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredArtifacts.length / ARTIFACT_ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <TagProvider>
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
                          onTagsChange={(updatedTags) => {
                            artifacts.map(a =>
                              a.id === artifact.id
                                ? { ...a, tags: updatedTags }
                                : a
                            );
                          }}
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
      </div>
      <div className="mt-5 flex w-full justify-center">
        <Pagination 
          totalPages={totalPages} 
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </TagProvider>
  );
}