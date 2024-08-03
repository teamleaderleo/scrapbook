'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/components/button";
import { PlusCircle, Smile, SendHorizontal } from 'lucide-react';
import { useUIStore } from '@/app/lib/stores/ui-store';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { JSONContent } from '@tiptap/react';

const Footer: React.FC = () => {
  const { currentProject } = useUIStore();
  const { addBlock } = useBlocks();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none',
      },
    },
  });

  const placeholder = currentProject
    ? `Create a block in ${currentProject.name}...`
    : "Create a block...";

  const handleSubmit = async () => {
    if (editor && editor.getText().trim() !== '') {
      setIsSubmitting(true);
      // const content: JSONContent = editor.getJSON();
      addBlock(editor.getJSON());
      editor.commands.setContent('');
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#36393f] border-t border-[#2f3136] p-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
          <PlusCircle className="h-5 w-5" />
        </Button>
        <div className="flex-grow bg-[#40444b] rounded-md text-white">
          <EditorContent
            editor={editor}
            className="p-2"
            placeholder={placeholder}
          />
        </div>
        <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </footer>
  );
};

export default Footer;