// 'use client';

// import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
// import Link from 'next/link';
// import { deleteTag } from '@/app/lib/tag-actions';
// import { useTransition } from 'react';
// import { ADMIN_UUID } from '@/app/lib/constants';



// export function UpdateTag({ id }: { id: string }) {
//   return (
//     <button
//       href={`/dashboard/tags/${id}/edit`}
//       className="rounded-md border p-2 hover:bg-gray-100"
//       aria-label={`Edit ${tag.name}`}
//     >
//       <PencilIcon className="w-5" />
//     </button>

//     // <button
//     //     onClick={() => setEditingTag(tag)}
//     //     className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600"
//     //     aria-label={`Edit ${tag.name}`}
//     // >
//     //     Edit
//     // </button>
//   );
// }

// export function DeleteTag({ id, onDelete }: { id: string; onDelete: () => void }) {
//   const [isPending, startTransition] = useTransition();

//   const handleDelete = async () => {
//     startTransition(async () => {
//       const result = await deleteTag(ADMIN_UUID, id);
//       if (result.success) {
//         onDelete();
//       } else {
//         console.error(result.message);
//       }
//     });
//   };

//   return (
//     <button
//       className="rounded-md border p-2 hover:bg-gray-100"
//       onClick={handleDelete}
//       disabled={isPending}
//     >
//       <span className="sr-only">Delete</span>
//       <TrashIcon className="w-5" />
//     </button>
//   );
// }