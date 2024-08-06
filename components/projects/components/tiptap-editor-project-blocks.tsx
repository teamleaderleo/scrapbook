import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TiptapEditorProps {
  content: JSONContent;
  editable: boolean;
  onSave: (content: JSONContent) => void;
  onCancel: () => void;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, editable, onSave, onCancel }) => {
  const [originalContent, setOriginalContent] = useState<JSONContent>(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        hardBreak: {
          keepMarks: true,
        },
      }),
    ],
    content: originalContent,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-editor bg-gray-800 rounded p-2 focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
      if (editable) {
        setOriginalContent(content);
        editor.commands.setContent(content);
      }
    }
  }, [editor, editable, content]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editor || !editable) return;

      if (event.key === 'Enter') {
        if (!event.shiftKey) {
          event.preventDefault();
          onSave(editor.getJSON());
        } else {
          // Allow Shift+Enter for new lines
          editor.commands.enter();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        editor.commands.setContent(originalContent);
        onCancel();
      }
    };

    editor?.view.dom.addEventListener('keydown', handleKeyDown);
    return () => editor?.view.dom.removeEventListener('keydown', handleKeyDown);
  }, [editor, editable, onSave, onCancel, originalContent]);

  return <EditorContent editor={editor} />;
};

export default React.memo(TiptapEditor);