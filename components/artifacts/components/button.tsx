'use client';

import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteArtifact } from '@/app/lib/actions/artifact-actions';
import { useTransition } from 'react';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ArtifactWithRelations } from "@/app/lib/definitions/artifact-definitions";

export function CreateArtifact() {
  return (
    <Link
      href="/dashboard/artifacts/create"
      className="flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <span className="hidden md:block">Create Artifact</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateArtifact({ artifact }: { artifact: ArtifactWithRelations }) {
  return (
    <Link
      href={`/dashboard/artifacts/${artifact.id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteArtifact({ id, onDelete }: { id: string; onDelete: () => void }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteArtifact(id, ADMIN_UUID);
      if (result.success) {
        onDelete();
      } else {
        // Handle error, maybe show a toast notification
        console.error(result.message);
      }
    });
  };

  return (
    <button
      className="rounded-md border p-2 hover:bg-gray-100"
      onClick={handleDelete}
      disabled={isPending}
    >
      <span className="sr-only">Delete</span>
      <TrashIcon className="w-5" />
    </button>
  );
}
