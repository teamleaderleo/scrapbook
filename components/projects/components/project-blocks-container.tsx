// 'use client';

// import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import { useBlocks } from '@/app/lib/hooks/useBlocks';
// import { JSONContent } from '@tiptap/react';
// import ProjectBlockItem from './project-block-item';
// import { BlockWithRelations } from '@/app/lib/definitions/definitions';
// import { useUIStore } from '@/app/lib/stores/ui-store';

// interface ProjectBlocksContainerProps {
//   projectId: string;
// }

// const BLOCKS_PER_PAGE = 50;

// const ProjectBlocksContainer: React.FC<ProjectBlocksContainerProps> = ({ projectId }) => {
//   const { blocks, updateBlock, deleteBlock } = useBlocks();
//   const { editingBlockId, setEditingBlockId } = useUIStore();
//   const [visibleBlocks, setVisibleBlocks] = useState<number>(BLOCKS_PER_PAGE);
//   const [isLoading, setIsLoading] = useState(true);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const bottomRef = useRef<HTMLDivElement>(null);

//   const projectBlocks = useMemo(() => 
//     blocks
//       ?.filter(block => block.projects.some(project => project.id === projectId))
//       .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [],
//     [blocks, projectId]
//   );

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsLoading(false);
//       bottomRef.current?.scrollIntoView({ behavior: 'auto' });
//     }, 100);
//     return () => clearTimeout(timer);
//   }, []);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && visibleBlocks < projectBlocks.length) {
//           setVisibleBlocks(prev => Math.min(prev + BLOCKS_PER_PAGE, projectBlocks.length));
//         }
//       },
//       { root: containerRef.current, threshold: 0.1 }
//     );

//     if (containerRef.current?.firstElementChild) {
//       observer.observe(containerRef.current.firstElementChild);
//     }

//     return () => observer.disconnect();
//   }, [visibleBlocks, projectBlocks.length]);

//   const handleEditBlock = useCallback((blockId: string) => {
//     setEditingBlockId(blockId);
//   }, [setEditingBlockId]);

//   const handleSaveBlock = useCallback((blockId: string, content: JSONContent) => {
//     updateBlock({ id: blockId, data: content });
//     setEditingBlockId(null);
//   }, [updateBlock, setEditingBlockId]);

//   const handleCancelEdit = useCallback(() => {
//     setEditingBlockId(null);
//   }, [setEditingBlockId]);

//   const handleDeleteBlock = useCallback((blockId: string) => {
//     deleteBlock(blockId);
//   }, [deleteBlock]);

//   const renderContent = () => {
//     if (isLoading) {
//       return <div className="flex items-center justify-center h-full text-[#dcddde]">Loading blocks...</div>;
//     }

//     if (projectBlocks.length === 0) {
//       return <div className="flex items-center justify-center h-full text-[#dcddde]">No blocks found for this project.</div>;
//     }

//     const blocksToRender = projectBlocks.slice(0, visibleBlocks);

//     return (
//       <div className="flex flex-col-reverse">
//         <div ref={bottomRef} />
//         {blocksToRender.map((block: BlockWithRelations) => (
//           <ProjectBlockItem
//             key={block.id}
//             block={block}
//             onEdit={handleEditBlock}
//             onSave={handleSaveBlock}
//             onCancel={handleCancelEdit}
//             onDelete={handleDeleteBlock}
//           />
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div ref={containerRef} className="h-full bg-[#36393f] text-[#dcddde] overflow-y-auto flex flex-col-reverse">
//       {renderContent()}
//     </div>
//   );
// };

// export default React.memo(ProjectBlocksContainer);