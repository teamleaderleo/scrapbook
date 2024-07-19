'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Tag } from '@/app/lib/definitions';
import { useTags } from '@/app/lib/hooks/useTags';
import { useKeyNav } from '@/app/lib/hooks/useKeyNav';
import Pagination from '@/components/ui/pagination';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
import { useSearchParams } from 'next/navigation';

export default function TagManagementTable({ accountId }: { accountId: string }) {
  const { 
    paginatedTags,
    isLoading,
    error,
    addTag,
    updateTag,
    deleteTag,
    handleSearch,
    handlePageChange,
    currentPage,
    totalPages,
    useTagUsage,
  } = useTags();

  const { showToast } = useToastMessages();
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);


  const searchParams = useSearchParams();
  useEffect(() => {
    const query = searchParams.get('query') || '';
    const page = Number(searchParams.get('page')) || 1;
    handleSearch(query);
    handlePageChange(page);
  }, [searchParams, handleSearch, handlePageChange]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      try {
        await addTag(newTagName.trim());
        setNewTagName('');
        showToast('success', 'create', 'tag');
      } catch (error) {
        console.error('Failed to create tag:', error);
        showToast('error', 'create', 'tag');
      }
    }
  };

  const handleUpdateTag = async (tag: Tag, newName: string) => {
    try {
      await updateTag({ tagId: tag.id, newName: newName.trim() });
      setEditingTag(null);
      showToast('success', 'update', 'tag');
    } catch (error) {
      console.error('Failed to update tag:', error);
      showToast('error', 'update', 'tag');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag(tagId);
      showToast('success', 'delete', 'tag');
    } catch (error) {
      console.error('Failed to delete tag:', error);
      showToast('error', 'delete', 'tag');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="mt-6 flow-root">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
            <table className="min-w-full text-gray-900">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Name</th>
                  <th scope="col" className="px-3 py-5 font-medium">Usage</th>
                  <th scope="col" className="relative py-3 pl-6 pr-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedTags.map((tag) => (
                  <tr key={tag.id} className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                    <td className="whitespace-nowrap px-3 py-3">
                      {editingTag?.id === tag.id ? (
                        <input
                          type="text"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          onBlur={() => handleUpdateTag(tag, editingTag.name)}
                          className="border rounded px-2 py-1"
                          aria-label={`Edit tag name for ${tag.name}`}
                        />
                      ) : (
                        tag.name
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <TagUsage tagId={tag.id} useTagUsage={useTagUsage} />
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end gap-3">
                        {/* UpdateTag */}
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="rounded-md border p-2 hover:bg-gray-100"
                          aria-label={`Edit ${tag.name}`}
                        >
                          <PencilIcon className="w-5" />
                        </button>
                        {/* DeleteTag */}
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="rounded-md border p-2 hover:bg-gray-100"
                          aria-label={`Delete ${tag.name}`}
                        >
                          <TrashIcon className="w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <form onSubmit={handleCreateTag} className="mt-4 flex gap-2">
              <label htmlFor="new-tag-name" className="sr-only">New tag name</label>
              <input
                id="new-tag-name"
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name"
                className="flex-grow border rounded px-2 py-1"
              />
              <button
                type="submit"
                className="rounded bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600"
              >
                Add Tag
              </button>
            </form>
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

function TagUsage({ tagId, useTagUsage }: { tagId: string; useTagUsage: (tagId: string) => any }) {
  const { data: usage, isLoading, error } = useTagUsage(tagId);

  if (isLoading) return <span>Loading usage...</span>;
  if (error) return <span>Error loading usage</span>;

  return (
    <span>
      Projects: {usage.projectCount}, Artifacts: {usage.artifactCount}
    </span>
  );
}