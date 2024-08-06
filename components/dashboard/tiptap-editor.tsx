import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent, JSONContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface TiptapEditorProps {
  content: JSONContent;
  placeholder: string;
  editable?: boolean;
  onUpdate?: (editor: Editor) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  globalKeyListener?: boolean;
  autoFocus?: boolean;
  handleEnterKey?: boolean;
  handleEscapeKey?: boolean;
}

export interface TiptapEditorRef {
  focus: () => void;
  editor: Editor | null;
}

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(({
  content,
  placeholder,
  editable = true,
  onUpdate,
  onSubmit,
  onCancel,
  globalKeyListener = false,
  autoFocus = false,
  handleEnterKey = true,
  handleEscapeKey = true,
}, ref) => {
  const editorRef = useRef<Editor | null>(null);

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
        if (event.key === 'Enter' && !event.shiftKey && handleEnterKey) {
          event.preventDefault();
          onSubmit?.();
          return true;
        }
        if (event.key === 'Escape' && handleEscapeKey) {
          event.preventDefault();
          onCancel?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor as Editor);
      }
    },
  });

  useImperativeHandle(ref, () => ({
    focus: () => {
      editor?.commands.focus('end');
    },
    editor: editor,
  }), [editor]);

  useEffect(() => {
    editorRef.current = editor;
    if (autoFocus && editor) {
      editor.commands.focus('end');
    }
  }, [editor, autoFocus]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

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
});

TiptapEditor.displayName = 'TiptapEditor';

export default React.memo(TiptapEditor);