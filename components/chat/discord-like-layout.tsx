// 'use client';

// import React, { useState, useCallback, useRef } from 'react';
// import { Separator } from "@/components/ui/separator"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { useProjects } from '@/app/lib/hooks/useProjects';
// import { useBlocks } from '@/app/lib/hooks/useBlocks';
// import { ProjectWithBlocks, BlockWithRelations } from "@/app/lib/definitions/definitions";
// import { useEditor, EditorContent, JSONContent } from '@tiptap/react'
// import StarterKit from '@tiptap/starter-kit'
// import { Virtuoso } from 'react-virtuoso'

// const TipTapEditor = ({ content, onUpdate }: { content: JSONContent, onUpdate: (content: JSONContent) => void }) => {
//   const editor = useEditor({
//     extensions: [StarterKit],
//     content,
//     onUpdate: ({ editor }) => {
//       onUpdate(editor.getJSON());
//     },
//   });

//   return <EditorContent editor={editor} />;
// };

// const DiscordLikeLayout: React.FC = () => {
//   const {
//     projects,
//     isLoading: isLoadingProjects,
//     error: projectsError,
//     handleSearch: handleProjectSearch,
//     addProject,
//     updateProject,
//     deleteProject,
//   } = useProjects();

//   const {
//     blocks,
//     isLoading: isLoadingBlocks,
//     error: blocksError,
//     handleSearch: handleBlockSearch,
//     addBlock,
//     updateBlock,
//     deleteBlock,
//   } = useBlocks();

//   const [selectedProject, setSelectedProject] = useState<ProjectWithBlocks | null>(null);
//   const [newBlockContent, setNewBlockContent] = useState<JSONContent>({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] });
//   const [projectSearchQuery, setProjectSearchQuery] = useState('');
//   const [blockSearchQuery, setBlockSearchQuery] = useState('');

//   const projectListRef = useRef(null);
//   const blockListRef = useRef(null);

//   const handleProjectSelect = (project: ProjectWithBlocks) => {
//     setSelectedProject(project);
//     setBlockSearchQuery('');
//   };

//   const handleNewBlock = async () => {
//     if (selectedProject && newBlockContent) {
//       await addBlock({ content: newBlockContent });
//       setNewBlockContent({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] });
//     }
//   };

//   const handleProjectSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newQuery = e.target.value;
//     setProjectSearchQuery(newQuery);
//     handleProjectSearch(newQuery);
//   };

//   const handleBlockSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newQuery = e.target.value;
//     setBlockSearchQuery(newQuery);
//     handleBlockSearch(newQuery);
//   };

//   const handleBlockContentUpdate = useCallback((blockId: string, content: JSONContent) => {
//     updateBlock({ id: blockId, data: { content } });
//   }, [updateBlock]);

//   const handleAddProject = async () => {
//     await addProject({ name: 'New Project', description: '', status: 'pending' });
//   };

//   const filteredBlocks = blocks?.filter(block => 
//     selectedProject?.blocks.some(projectBlock => projectBlock.id === block.id) &&
//     JSON.stringify(block.content).toLowerCase().includes(blockSearchQuery.toLowerCase())
//   ) || [];

//   if (isLoadingProjects || isLoadingBlocks) return <div>Loading...</div>;
//   if (projectsError || blocksError) return <div>Error: {projectsError?.message || blocksError?.message}</div>;

//   return (
//     <div className="flex h-screen bg-background">
//       {/* Projects sidebar */}
//       <div className="w-64 bg-muted p-4 flex flex-col">
//         <Input
//           placeholder="Search projects..."
//           value={projectSearchQuery}
//           onChange={handleProjectSearchChange}
//           className="mb-4"
//         />
//         <Virtuoso
//           ref={projectListRef}
//           style={{ height: 'calc(100vh - 120px)' }}
//           totalCount={projects?.length || 0}
//           itemContent={(index) => {
//             const project = projects![index];
//             return (
//               <Button
//                 key={project.id}
//                 variant={selectedProject?.id === project.id ? "secondary" : "ghost"}
//                 className="w-full justify-start mb-2"
//                 onClick={() => handleProjectSelect(project)}
//               >
//                 {project.name}
//               </Button>
//             );
//           }}
//         />
//         <Button onClick={handleAddProject}>Add Project</Button>
//       </div>

//       <Separator orientation="vertical" />

//       {/* Main content area */}
//       <div className="flex-1 flex flex-col">
//         {selectedProject ? (
//           <>
//             <div className="p-4 bg-muted flex justify-between items-center">
//               <div>
//                 <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
//                 <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
//               </div>
//               <Button variant="outline" onClick={() => deleteProject(selectedProject.id)}>Delete Project</Button>
//             </div>
//             <div className="p-4">
//               <Input
//                 placeholder="Search blocks..."
//                 value={blockSearchQuery}
//                 onChange={handleBlockSearchChange}
//                 className="mb-4"
//               />
//             </div>
//             <Virtuoso
//               ref={blockListRef}
//               style={{ flex: 1 }}
//               totalCount={filteredBlocks.length}
//               itemContent={(index) => {
//                 const block = filteredBlocks[index];
//                 return (
//                   <div key={block.id} className="mb-4 p-3 bg-card rounded-lg">
//                     <TipTapEditor
//                       content={block.content as JSONContent}
//                       onUpdate={(content) => handleBlockContentUpdate(block.id, content)}
//                     />
//                     <Button variant="ghost" onClick={() => deleteBlock(block.id)} className="mt-2">Delete</Button>
//                   </div>
//                 );
//               }}
//             />
//             <div className="p-4 bg-muted">
//               <TipTapEditor
//                 content={newBlockContent}
//                 onUpdate={setNewBlockContent}
//               />
//               <Button onClick={handleNewBlock} className="mt-2">Add Block</Button>
//             </div>
//           </>
//         ) : (
//           <div className="flex items-center justify-center h-full text-muted-foreground">
//             Select a project to view its blocks
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DiscordLikeLayout;