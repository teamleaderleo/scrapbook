'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from "@/components/ui/components/button";
import { PlusCircle, Smile, SendHorizontal } from 'lucide-react';
import { useUIStore, useDraftStore } from '@/app/lib/stores/ui-store';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { JSONContent } from '@tiptap/react';
import { createBlockInProject } from '@/app/lib/actions/block-actions';
import { ADMIN_UUID } from '@/app/lib/constants';

const Footer: React.FC = () => {
  const { currentProject } = useUIStore();
  const { saveDraft, getDraft, clearDraft } = useDraftStore();
  const { createBlockInProject } = useBlocks(ADMIN_UUID);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  const placeholder = useMemo(() => 
    currentProject ? `Create a block in ${currentProject.name}...` : "Create a block...",
    [currentProject]
  );

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
      console.log(`Loading draft for project: ${currentProject.id}`);
      const draft = getDraft(currentProject.id);
      if (draft) {
        console.log('Loaded draft:', JSON.stringify(draft));
        editor.commands.setContent(draft);
      } else {
        console.log('No draft found, clearing editor');
        editor.commands.setContent('');
      }
      editor.commands.focus('end');
    }
  }, [editor, currentProject, getDraft]);

  const handleSubmit = useCallback(() => {
    if (editor && editor.getText().trim() !== '' && currentProject) {
      setIsSubmitting(true);
      const content = editor.getJSON();
      console.log(`Creating block for project: ${currentProject.id}`);
      console.log('Block content:', JSON.stringify(content));
      
      createBlockInProject(
        { projectId: currentProject.id, data: content },
        {
          onSuccess: (result) => {
            if (result.success) {
              console.log('Block created and added to project successfully');
              editor.commands.setContent('');
              setIsTyping(false);
              clearDraft(currentProject.id);
              console.log(`Cleared draft for project: ${currentProject.id}`);
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
    }
  }, [editor, createBlockInProject, currentProject, clearDraft]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!editor) return;

      if (event.key === 'Enter' && !event.shiftKey && isTyping) {
        event.preventDefault();
        handleSubmit();
        return;
      }

      // Check if the editor or any of its children are focused
      if (!editor.isFocused && !footerRef.current?.contains(document.activeElement)) {
        // If it's a printable character, focus the editor and insert the character
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          editor.commands.focus('end');
          editor.commands.insertContent(event.key);
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editor, isTyping, handleSubmit]);

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