import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TiptapEditorProps {
  content: JSONContent;
  editable: boolean;
  onSave: (content: JSONContent) => void;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, editable, onSave }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-editor bg-gray-800 rounded p-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (editable) {
        onSave(editor.getJSON());
      }
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  return <EditorContent editor={editor} />;
};

export default React.memo(TiptapEditor);