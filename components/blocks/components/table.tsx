// 'use client';

// import React from 'react';
// import { useBlocks } from '@/app/lib/hooks/useBlocks';
// import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
// import { TagList } from '@/components/tags/taglist';
// import { DeleteBlock, UpdateBlock } from '@/components/blocks/components/button';
// import Pagination from '../../ui/components/pagination';
// import { ErrorBoundaryWithToast } from '../../errors/error-boundary';
// import { BlockThumbnail } from './block-thumbnail';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { TiptapPreview } from '@/components/editor/content-preview';
// import { BlockFormSubmission, BlockWithRelations, Tag } from '@/app/lib/definitions/definitions';
// import { JSONContent } from '@tiptap/react';

// export function BlockTable() {
//   const { 
//     paginatedBlocks,
//     isLoading,
//     error,
//     updateBlock,
//     deleteBlock,
//     handlePageChange,
//     currentPage,
//     totalPages,
//   } = useBlocks();

//   const { showToast } = useToastMessages();

//   const handleTagsChange = async (block: BlockWithRelations, newTags: Tag[]) => {
//     try {
//       const updatedBlockData: BlockFormSubmission = {
//         content: block.content as JSONContent,
//         tags: newTags.map(tag => tag.id),
//         projects: block.projects.map(p => p.id)
//       };

//       await updateBlock({ 
//         id: block.id, 
//         data: updatedBlockData
//       });
//       showToast('success', 'updateTags', 'block');
//     } catch (error) {
//       console.error('Failed to update block tags:', error);
//       showToast('error', 'updateTags', 'block');
//     }
//   };

//   const handleDeleteBlock = async (id: string) => {
//     try {
//       await deleteBlock(id);
//       showToast('success', 'delete', 'block');
//     } catch (error) {
//       console.error('Failed to delete block:', error);
//       showToast('error', 'delete', 'block');
//     }
//   };

//   if (isLoading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error.message}</div>;

//   return (
//     <div className="space-y-4">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Preview</TableHead>
//             <TableHead>Tags</TableHead>
//             <TableHead>Projects</TableHead>
//             <TableHead>Updated</TableHead>
//             <TableHead>Content Preview</TableHead>
//             <TableHead className="text-right">Actions</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {paginatedBlocks.map((block: BlockWithRelations) => (
//             <TableRow key={block.id}>
//               <TableCell className="font-medium">
//                 <div className="flex items-center space-x-3">
//                   {/* <ErrorBoundaryWithToast>
//                     <BlockThumbnail
//                       block={block}
//                       size={40}
//                       priority={true}
//                       className="rounded-full"
//                     />
//                   </ErrorBoundaryWithToast> */}
//                 </div>
//               </TableCell>
//               <TableCell>
//                 <TagList
//                   selectedTags={block.tags || []}
//                   onTagsChange={(newTags) => handleTagsChange(block, newTags)}
//                 />
//               </TableCell>
//               <TableCell>{block.projects.length}</TableCell>
//               <TableCell>{new Date(block.updatedAt).toLocaleDateString()}</TableCell>
//               <TableCell>
//                 {block.content ? (
//                   <TiptapPreview content={block.content} maxLength={30} />
//                 ) : (
//                   <span className="text-gray-500">No content</span>
//                 )}
//               </TableCell>
//               <TableCell className="text-right">
//                 <UpdateBlock block={block} />
//                 <DeleteBlock 
//                   id={block.id} 
//                   onDelete={() => handleDeleteBlock(block.id)}  
//                 />
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//       <div className="flex justify-center">
//         <Pagination 
//           totalPages={totalPages} 
//           currentPage={currentPage}
//           onPageChange={handlePageChange}
//         />
//       </div>
//     </div>
//   );
// }