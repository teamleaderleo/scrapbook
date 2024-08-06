'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from "@/components/ui/components/button";
import { PlusCircle, Smile, SendHorizontal } from 'lucide-react';
import { useUIStore, useDraftStore } from '@/app/lib/stores/ui-store';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ProjectWithBlocks } from '@/app/lib/definitions/definitions';

const Footer: React.FC = () => {
  const { currentProject } = useUIStore();
  const { saveDraft, getDraft, clearDraft } = useDraftStore();
  const { createBlockInProject } = useBlocks(ADMIN_UUID);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const currentProjectRef = useRef<ProjectWithBlocks | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

  const placeholder = useMemo(() => 
    currentProject ? `Create a block in ${currentProject.name}...` : "Create a block...",
    [currentProject]
  );

  useEffect(() => {
    currentProjectRef.current = currentProject;
  }, [currentProject]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      // handleDOMEvents: {
      //       keydown: (_, event) => {
      //            if (event.key === 'Enter')  {
      //               handleSubmit();
      //               return true;
      //            }
      //       },
      //   },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          if (event.shiftKey) {
            // Shift+Enter: create a new line
            return false; // Let Tiptap handle it
          } else {

            // Regular Enter: submit
            // event.preventDefault(); breaks
            handleSubmit();
            return true;
          }
        }
        return false;
      },
    },
    editable: true,
    onUpdate: ({ editor }) => {
      setIsTyping(editor.getText().trim().length > 0);
      saveDraft(editor.getJSON());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      const placeholderExtension = editor.extensionManager.extensions.find(
        (extension) => extension.name === "placeholder"
      );
      if (placeholderExtension) {
        placeholderExtension.options['placeholder'] = placeholder;
        editor.view.dispatch(editor.state.tr);
      }
    }
  }, [editor, placeholder]);

  useEffect(() => {
    if (editor && currentProject) {
      const draft = getDraft(currentProject.id);
      if (draft) {
        editor.commands.setContent(draft);
      } else {
        editor.commands.setContent('');
      }
      editor.commands.focus('end');
    }
  }, [editor, currentProject, getDraft]);

  const handleSubmit = useCallback(() => {
    const project = currentProjectRef.current;
    const editor = editorRef.current;
    if (editor && editor.getText().trim() !== '' && project) {
      setIsSubmitting(true);
      const content = editor.getJSON();
      
      createBlockInProject(
        { projectId: project.id, data: content },
        {
          onSuccess: (result) => {
            if (result.success) {
              editor.commands.setContent('');
              setIsTyping(false);
              clearDraft(project.id);
            } else {
              console.error('Failed to create block in project:', result.message);
            }
          },
          onError: (error) => {
            console.error('Error creating block in project:', error);
          },
          onSettled: () => {
            setIsSubmitting(false);
          }
        }
      );
    } else {
      console.error('Cannot create block: No current project, no editor, or empty content');
    }
  }, [createBlockInProject, clearDraft, setIsSubmitting, setIsTyping]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!editor) return;

      // Check if we're editing a block or if the footer editor is focused
      if (document.querySelector('.tiptap-editor:focus') || editor.isFocused) {
        return;
      }

      // If it's a printable character, focus the editor and insert the character
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        editor.commands.focus('end');
        editor.commands.insertContent(event.key);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editor]);

  return (
    <footer ref={footerRef} className="bg-[#36393f] border-t border-[#2f3136] p-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
          <PlusCircle className="h-5 w-5" />
        </Button>
        <div className="flex-grow">
          <EditorContent editor={editor} />
        </div>
        <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`${isTyping ? 'text-white' : 'text-[#b9bbbe]'} hover:text-white hover:bg-[#4f545c]`}
          onClick={handleSubmit}
          disabled={isSubmitting || !isTyping}
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </footer>
  );
};

export default Footer;