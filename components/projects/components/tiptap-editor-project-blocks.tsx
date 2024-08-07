import React, { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, JSONContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TiptapEditorProps {
  content: JSONContent;
  editable: boolean;
  onSave: (content: JSONContent) => void;
  onCancel: () => void;
  isTagManagerActive: boolean;
}

export interface TiptapEditorRef {
  focus: () => void;
  editor: Editor | null;
}

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(({ content, editable, onSave, onCancel, isTagManagerActive }, ref) => {
  const [originalContent, setOriginalContent] = useState<JSONContent>(content);
  const editorRef = useRef<Editor | null>(null);

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
        class: 'tiptap-editor bg-[#36393f] text-[#dcddde] rounded p-2 focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        if (!editorRef.current || isTagManagerActive) return false;

        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onSave(editorRef.current.getJSON());
          return true;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          editorRef.current.commands.setContent(originalContent);
          onCancel();
          return true;
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => ({
    focus: () => {
      editorRef.current?.commands.focus('end');
    },
    editor: editorRef.current,
  }), []);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setEditable(editable);
      if (editable) {
        setOriginalContent(content);
        editorRef.current.commands.setContent(content);
      }
    }
  }, [editable, content]);

  return <EditorContent editor={editor} />;
});

TiptapEditor.displayName = 'TiptapEditor';

export default React.memo(TiptapEditor);