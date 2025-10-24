// 'use client';

// import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// import { Editor, JSONContent } from '@tiptap/react';
// import { Button } from "@/components/ui/components/button";
// import { PlusCircle, Smile, SendHorizontal } from 'lucide-react';
// import { useUIStore, useDraftStore } from '@/app/lib/stores/ui-store';
// import { useBlocks } from '@/app/lib/hooks/useBlocks';
// import { ADMIN_UUID } from '@/app/lib/constants';
// import { ProjectWithBlocks } from '@/app/lib/definitions/definitions';
// import TiptapEditor, { TiptapEditorRef } from './footer-tiptap-editor';

// const Footer: React.FC = () => {
//   const { currentProject } = useUIStore();
//   const { saveDraft, getDraft, clearDraft } = useDraftStore();
//   const { createBlockInProject } = useBlocks(ADMIN_UUID);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const footerRef = useRef<HTMLDivElement>(null);
//   const currentProjectRef = useRef<ProjectWithBlocks | null>(null);
//   const editorRef = useRef<Editor | null>(null);
//   const tiptapRef = useRef<TiptapEditorRef>(null);

//   const placeholder = useMemo(() => 
//     currentProject ? `Create a block in ${currentProject.name}...` : "Create a block...",
//     [currentProject]
//   );

//   const editorContent = useMemo(() => {
//     if (currentProject) {
//       const draft = getDraft(currentProject.id);
//       if (draft) {
//         return draft as JSONContent;
//       }
//     }
//     return { type: 'doc', content: [{ type: 'paragraph' }] } as JSONContent;
//   }, [currentProject, getDraft]);

//   useEffect(() => {
//     currentProjectRef.current = currentProject;
//     if (currentProject) {
//       tiptapRef.current?.focus();
//     }
//   }, [currentProject]);

//   const handleUpdate = useCallback((editor: Editor) => {
//     setIsTyping(editor.getText().trim().length > 0);
//     saveDraft(editor.getJSON());
//   }, [saveDraft]);

//   const handleSubmit = useCallback(() => {
//     const project = currentProjectRef.current;
//     const editor = editorRef.current;
//     if (editor && editor.getText().trim() !== '' && project) {
//       setIsSubmitting(true);
//       const content = editor.getJSON();
      
//       createBlockInProject(
//         { projectId: project.id, data: content },
//         {
//           onSuccess: (result) => {
//             if (result.success) {
//               editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
//               setIsTyping(false);
//               clearDraft(project.id);
//               tiptapRef.current?.focus();
//             } else {
//               console.error('Failed to create block in project:', result.message);
//             }
//           },
//           onError: (error) => {
//             console.error('Error creating block in project:', error);
//           },
//           onSettled: () => {
//             setIsSubmitting(false);
//           }
//         }
//       );
//     } else {
//       console.error('Cannot create block: No current project, no editor, or empty content');
//     }
//   }, [createBlockInProject, clearDraft, setIsSubmitting, setIsTyping]);

//   return (
//     <footer ref={footerRef} className="bg-[#36393f] border-t border-[#2f3136] p-4">
//       <div className="flex items-center space-x-2">
//         <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
//           <PlusCircle className="h-5 w-5" />
//         </Button>
//         <div className="flex-grow">
//           <TiptapEditor
//             ref={tiptapRef}
//             content={editorContent}
//             placeholder={placeholder}
//             onUpdate={(editor) => {
//               editorRef.current = editor;
//               handleUpdate(editor);
//             }}
//             onSubmit={handleSubmit}
//             globalKeyListener={true}
//             autoFocus={true}
//             handleEnterKey={true}
//             handleEscapeKey={false}
//           />
//         </div>
//         <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
//           <Smile className="h-5 w-5" />
//         </Button>
//         <Button
//           variant="ghost"
//           size="icon"
//           className={`${isTyping ? 'text-white' : 'text-[#b9bbbe]'} hover:text-white hover:bg-[#4f545c]`}
//           onClick={handleSubmit}
//           disabled={isSubmitting || !isTyping}
//         >
//           <SendHorizontal className="h-5 w-5" />
//         </Button>
//       </div>
//     </footer>
//   );
// };

// export default Footer;