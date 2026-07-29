'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/components/ui/sidebar';
import { useItems } from '@/app/lib/contexts/item-context';
import styles from './monaco-editor-panel.module.css';

export function MonacoEditorPanel() {
  const { editorOpen, setEditorOpen } = useItems();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const { state } = useSidebar();
  const [editorHeight, setEditorHeight] = useState(384);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const isDark = resolvedTheme === 'dark';
  const shikiTheme = isDark ? 'catppuccin-macchiato' : 'one-light';
  const sidebarWidth = state === 'collapsed' ? '3rem' : '16rem';

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;

      if (isMod && !event.altKey && !event.shiftKey && (event.key === 'i' || event.code === 'KeyI')) {
        event.preventDefault();
        setEditorOpen(!editorOpen);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editorOpen, setEditorOpen]);

  useEffect(() => {
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(shikiTheme);
  }, [shikiTheme]);

  useEffect(() => {
    if (!editorOpen) {
      setEditorHeight(384);
      setIsInitializing(false);
      setInitializationError(null);
      return;
    }

    if (!editorRef.current) return;

    setIsInitializing(true);
    setInitializationError(null);

    const styleId = 'monaco-no-italics';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = '.monaco-editor .view-line span { font-style: normal !important; }';
      document.head.appendChild(style);
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const initEditor = async () => {
      if (typeof window !== 'undefined') {
        (window as any).MonacoEnvironment = {
          getWorker() {
            return new Worker(
              URL.createObjectURL(
                new Blob(['self.onmessage = () => {}'], { type: 'text/javascript' }),
              ),
            );
          },
        };
      }

      const [{ createHighlighter }, { shikiToMonaco }, _pythonContribution, monaco] =
        await Promise.all([
          import('shiki'),
          import('@shikijs/monaco'),
          import('monaco-editor/esm/vs/basic-languages/python/python.contribution'),
          import('monaco-editor'),
        ]);

      if (disposed || !editorRef.current) return;

      const highlighter = await createHighlighter({
        themes: ['one-light', 'catppuccin-macchiato'],
        langs: ['python'],
      });

      if (disposed || !editorRef.current) return;

      monacoRef.current = monaco;
      monaco.languages.register?.({ id: 'python' });
      shikiToMonaco(highlighter, monaco);

      const editor = monaco.editor.create(editorRef.current, {
        value: '',
        language: 'python',
        theme: shikiTheme,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 24,
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 4,
        insertSpaces: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        padding: { top: 16, bottom: 16 },
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
      });

      monaco.editor.setTheme(shikiTheme);
      setIsInitializing(false);

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
        setEditorOpen(false);
      });

      editor.focus();

      editor.onDidContentSizeChange(() => {
        const contentHeight = editor.getContentHeight();
        const maxHeight = window.innerHeight - 112;
        const newHeight = Math.max(384, Math.min(contentHeight + 32, maxHeight));
        setEditorHeight(newHeight);
      });

      cleanup = () => editor.dispose();
    };

    void initEditor().catch((error) => {
      console.error('Unable to initialize Monaco editor', error);
      if (disposed) return;
      setIsInitializing(false);
      setInitializationError('The editor could not open. Close it and try again.');
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [editorOpen, setEditorOpen, shikiTheme]);

  if (!editorOpen) return null;

  return (
    <div
      className={`${styles.panel} z-50 overflow-hidden rounded-lg border border-border bg-background shadow-2xl transition-[left,width] duration-200 ease-linear`}
      style={
        {
          '--editor-left': `calc(${sidebarWidth} + 1rem)`,
          '--editor-width': `calc((100vw - ${sidebarWidth} - 2rem) / 2 - 0.375rem)`,
          '--editor-height': `${editorHeight}px`,
        } as CSSProperties
      }
      data-space-editor-panel
    >
      {isInitializing ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f4f1ea] px-6 text-center dark:bg-[#202126]">
          <p className="animate-pulse text-sm text-[#383a42] dark:text-[#cad3f5]">
            Opening editor…
          </p>
        </div>
      ) : null}

      {initializationError ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#f4f1ea] px-6 text-center dark:bg-[#202126]">
          <p className="max-w-sm text-sm leading-relaxed text-[#383a42] dark:text-[#cad3f5]">
            {initializationError}
          </p>
          <button
            type="button"
            onClick={() => setEditorOpen(false)}
            className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-sm font-medium text-black/75 transition hover:bg-black/[0.04] active:scale-[0.98] dark:border-white/15 dark:bg-[#18191d] dark:text-white/80 dark:hover:bg-[#25262c]"
          >
            Close editor
          </button>
        </div>
      ) : null}

      <div ref={editorRef} className="h-full w-full" />
    </div>
  );
}
