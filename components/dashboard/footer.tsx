'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from "@/components/ui/components/button";
import { PlusCircle, Smile, SendHorizontal } from 'lucide-react';
import { useUIStore } from '@/app/lib/stores/ui-store';
import { useBlocks } from '@/app/lib/hooks/useBlocks';

const Footer: React.FC = () => {
  const { currentProject } = useUIStore();
  const { addBlock } = useBlocks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const placeholder = currentProject
    ? `Create a block in ${currentProject.name}...`
    : "Create a block...";

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setIsTyping(editor.getText().trim().length > 0);
    },
  }, [isMounted]);

  useEffect(() => {
    if (editor && editor.isEditable) {
      const placeholderExtension = editor.extensionManager.extensions.find(
        (extension) => extension.name === "placeholder"
      );
      if (placeholderExtension) {
        placeholderExtension.options['placeholder'] = placeholder;
        editor.view.dispatch(editor.state.tr);
      }
      editor.commands.focus('end');
    }
  }, [editor, placeholder, currentProject]);

  const handleSubmit = useCallback(async () => {
    if (editor && editor.getText().trim() !== '') {
      setIsSubmitting(true);
      addBlock(editor.getJSON());
      editor.commands.setContent('');
      setIsTyping(false);
      setIsSubmitting(false);
    }
  }, [editor, addBlock]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && isTyping) {
        event.preventDefault();
        handleSubmit();
      } else if (event.key !== 'Enter' && !editor?.isFocused) {
        editor?.commands.focus('end');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, isTyping, handleSubmit]);

  return (
    <footer className="bg-[#36393f] border-t border-[#2f3136] p-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
          <PlusCircle className="h-5 w-5" />
        </Button>
        <div className="flex-grow">
          {isMounted && <EditorContent editor={editor} />}
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