import React, { useEffect, useRef } from 'react';
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
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          if (event.shiftKey) {
            return false; // Let Tiptap handle Shift+Enter
          } else {
            onSubmit?.();
            return true;
          }
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