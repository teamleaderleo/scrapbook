import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface TiptapEditorProps {
  content: JSONContent;
  placeholder: string;
  editable?: boolean;
  onUpdate?: (content: JSONContent) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  globalKeyListener?: boolean;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  placeholder,
  editable = true,
  onUpdate,
  onSubmit,
  onCancel,
  globalKeyListener = false,
}) => {
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        hardBreak: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-editor bg-gray-800 rounded p-2 focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onSubmit?.();
          return true;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancel?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getJSON());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (globalKeyListener) {
      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        if (!editorRef.current) return;
        if (document.querySelector('.tiptap-editor:focus') || editorRef.current.isFocused) return;
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          editorRef.current.commands.focus('end');
          editorRef.current.commands.insertContent(event.key);
        }
      };

      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [globalKeyListener]);

  return <EditorContent editor={editor} />;
};

export default React.memo(TiptapEditor);