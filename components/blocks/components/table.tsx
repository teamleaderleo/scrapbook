'use client';

import React, { useEffect } from 'react';
import { TagList } from '@/components/tags/taglist';
import { DeleteBlock, UpdateBlock } from '@/components/blocks/components/button';
import Pagination from '../../ui/components/pagination';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { BlockThumbnail } from './block-thumbnail';
import { ErrorBoundaryWithToast } from '../../errors/error-boundary';
import { Tag } from '@/app/lib/definitions/definitions';
import { BlockWithRelations } from "@/app/lib/definitions/definitions";
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
import { Suspense } from 'react';
import { SearchParamsHandler } from '../../search-params-handler';

export function BlockTable({ accountId }: { accountId: string }) {
  const { 
    paginatedBlocks,
    isLoading,
    error,
    updateBlock,
    deleteBlock,
    handleSearch,
    handlePageChange,
    currentPage,
    totalPages,
    updateBlockTags,
  } = useBlocks();

  const { showToast } = useToastMessages();

  const handleTagsChange = async (blockId: string, newTags: string[]) => {
    await updateBlockTags({ blockId, tags: newTags });
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await deleteBlock(id);
      showToast('success', 'delete', 'block');
    } catch (error) {
      console.error('Failed to delete block:', error);
      showToast('error', 'delete', 'block');
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
                {paginatedBlocks.map((block: BlockWithRelations) => (
                  <tr key={block.id} className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 relative overflow-hidden rounded-full">
                          <ErrorBoundaryWithToast>
                            <BlockThumbnail
                              block={block}
                              size={40}
                              priority={true}
                              className="flex-shrink-0"
                            />
                          </ErrorBoundaryWithToast> 
                        </div>
                        <div className="ml-4">
                          <p className="font-medium">{block.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {block.contents && block.contents.length > 0 ? block.contents[0].type : 'No content'}
                    </td>
                    <td className="px-3 py-3">{block.description}</td>
                    <td className="px-3 py-3">
                      <TagList
                        initialTags={block.tags.map(t => t.name)}
                        onTagsChange={(newTags) => handleTagsChange(block.id, newTags)}
                        accountId={accountId}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{block.projects.length}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {new Date(block.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex space-x-2">
                        {block.contents && block.contents.length > 0 ? (
                          block.contents.slice(0, 3).map((content, index) => (
                            <div key={index} className="w-10 h-10 relative overflow-hidden rounded-full">
                              <ErrorBoundaryWithToast> 
                                <BlockThumbnail
                                  block={block}
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
                        <UpdateBlock block={block} />
                        <DeleteBlock 
                          id={block.id} 
                          onDelete={() => handleDeleteBlock(block.id)}  
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