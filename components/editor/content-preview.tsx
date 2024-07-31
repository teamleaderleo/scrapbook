import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TiptapPreviewProps {
  content: any; // This should be the Tiptap JSON content
  maxLength?: number;
}

export const TiptapPreview: React.FC<TiptapPreviewProps> = ({ content, maxLength = 50 }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: false,
  });

  const truncatedContent = editor?.getText().slice(0, maxLength);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          {truncatedContent}
          {editor && editor.getText().length > maxLength ? '...' : ''}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Content Preview</DialogTitle>
          <DialogDescription>Full content preview</DialogDescription>
        </DialogHeader>
        <EditorContent editor={editor} />
      </DialogContent>
    </Dialog>
  );
};