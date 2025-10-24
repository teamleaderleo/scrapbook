// import React, { useState, useCallback, useRef } from 'react';
// import { Button } from "@/components/ui/button";
// import { Trash2, Edit, Sun, Moon, Coffee, Briefcase } from 'lucide-react';
// import { JSONContent } from '@tiptap/react';
// import TiptapEditor, { TiptapEditorRef } from '@/components/projects/components/tiptap-editor-project-blocks';
// import TagManager from './tag-manager';
// import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
// import BlockTags from '@/components/blocks/components/block-tags';
// import { BlockWithRelations } from '@/app/lib/definitions/definitions';

// interface ProjectBlockItemProps {
//   block: BlockWithRelations;
//   onEdit: (blockId: string) => void;
//   onSave: (blockId: string, content: JSONContent) => void;
//   onCancel: () => void;
//   onDelete: (blockId: string) => void;
// }

// interface Personality {
//   name: string;
//   icon: React.ReactNode;
// }

// const getPersonality = (date: Date): Personality => {
//   const hour = date.getHours();
//   if (hour >= 5 && hour < 9) return { name: 'Early Bird', icon: <Coffee className="w-4 h-4" /> };
//   if (hour >= 9 && hour < 17) return { name: 'Work Mode', icon: <Briefcase className="w-4 h-4" /> };
//   if (hour >= 17 && hour < 22) return { name: 'Evening Self', icon: <Sun className="w-4 h-4" /> };
//   return { name: 'Night Owl', icon: <Moon className="w-4 h-4" /> };
// };

// const ProjectBlockItem: React.FC<ProjectBlockItemProps> = ({ block, onEdit, onSave, onCancel, onDelete }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [isTagManagerActive, setIsTagManagerActive] = useState(false);
//   const editorRef = useRef<TiptapEditorRef>(null);
//   const createdDate = new Date(block.createdAt);
//   const personality = getPersonality(createdDate);

//   const handleEdit = useCallback(() => {
//     setIsEditing(true);
//     onEdit(block.id);
//     setTimeout(() => {
//       editorRef.current?.focus();
//     }, 0);
//   }, [block.id, onEdit]);

//   const handleSave = useCallback((content: JSONContent) => {
//     onSave(block.id, content);
//     setIsEditing(false);
//   }, [block.id, onSave]);

//   const handleCancel = useCallback(() => {
//     onCancel();
//     setIsEditing(false);
//   }, [onCancel]);

//   return (
//     <div className="px-4 py-2 hover:bg-[#32353b] transition-colors duration-200 group relative">
//       <div className="flex items-center mb-1">
//         <div className="font-semibold mr-2 text-white flex items-center">
//           {personality.icon}
//           <span className="ml-2">{personality.name}</span>
//         </div>
//         <div className="text-xs text-[#72767d]">
//           {createdDate.toLocaleString()}
//         </div>
//       </div>
//       <TiptapEditor
//         ref={editorRef}
//         content={block.content as JSONContent}
//         editable={isEditing}
//         onSave={handleSave}
//         onCancel={handleCancel}
//         isTagManagerActive={isTagManagerActive}
//       />
//       <BlockTags blockId={block.id} />
//       {!isEditing && (
//         <TooltipProvider delayDuration={0}>
//           <div className="absolute top-2 right-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//             <div className="flex items-center bg-[#2f3136] rounded overflow-hidden">
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <div>
//                     <TagManager
//                       blockId={block.id}
//                       onOpenChange={(isOpen) => setIsTagManagerActive(isOpen)}
//                     />
//                   </div>
//                 </TooltipTrigger>
//                 <TooltipContent side="bottom">
//                   <p>Add Tag</p>
//                 </TooltipContent>
//               </Tooltip>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     onClick={handleEdit}
//                     className="text-[#b9bbbe] hover:text-white hover:bg-[#3f4248] rounded-none h-10 w-10 p-0"
//                   >
//                     <Edit className="h-5 w-5" />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent side="bottom">
//                   <p>Edit Block</p>
//                 </TooltipContent>
//               </Tooltip>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     onClick={() => onDelete(block.id)}
//                     className="text-[#b9bbbe] hover:text-[#ed4245] hover:bg-[#3f4248] rounded-none h-10 w-10 p-0"
//                   >
//                     <Trash2 className="h-5 w-5" />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent side="bottom">
//                   <p>Delete Block</p>
//                 </TooltipContent>
//               </Tooltip>
//             </div>
//           </div>
//         </TooltipProvider>
//       )}
//     </div>
//   );
// };

// export default React.memo(ProjectBlockItem);