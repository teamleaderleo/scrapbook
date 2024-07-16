'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Tag } from '@/app/lib/definitions';
import { createTag, updateTag, deleteTag, } from '@/app/lib/actions/tag-actions';
import { ADMIN_UUID } from '@/app/lib/constants';

type TagUsage = {
  project_count: number;
  artifact_count: number;
};

export default function TagManagementTable({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState(initialTags);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      const createdTag = await createTag(ADMIN_UUID, newTagName.trim());
      setTags([...tags, createdTag]);
      setNewTagName('');
    }
  };

  const handleUpdateTag = async (tag: Tag, newName: string) => {
    const updatedTag = await updateTag(ADMIN_UUID, tag.id, newName.trim());
    setTags(tags.map(t => t.id === updatedTag.id ? updatedTag : t));
    setEditingTag(null);
  };

  const handleDeleteTag = async (tagId: string) => {
    await deleteTag(ADMIN_UUID, tagId);
    setTags(tags.filter(t => t.id !== tagId));
  };

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
                {tags.map((tag) => (
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
                      <TagUsage tagId={tag.id} />
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
    </div>
  );
}

function TagUsage({ tagId }: { tagId: string }) {
  const [usage, setUsage] = useState<TagUsage>({ project_count: 0, artifact_count: 0 });

  // useEffect(() => {
  //   async function fetchUsage() {
  //     const usageData = await getTagUsage(ADMIN_UUID, tagId);
  //     setUsage({
  //       project_count: Number(usageData.projectCount),
  //       artifact_count: Number(usageData.artifactCount)
  //     });
  //   }
  //   fetchUsage();
  // }, [tagId]);

  return (
    <span>
      Projects: {usage.project_count}, Artifacts: {usage.artifact_count}
    </span>
  );
}