'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/components/ui/sidebar';
import { useItems } from '@/app/lib/contexts/item-context';
import {
  useSpaceShortcut,
  useSpaceShortcuts,
} from '@/components/space/space-shortcut-provider';
import {
  createBrowserEditorSheetRestoration,
  createEditorSheetHistoryState,
  ownsEditorSheetHistoryState,
  resolveEditorSheetViewport,
  type EditorSheetViewport,
} from '@/lib/space-editor-sheet';

const DEFAULT_EDITOR_HEIGHT = 384;

function visibleEditorTrigger() {
  return (
    Array.from(
      document.querySelectorAll<HTMLElement>('[data-space-editor-trigger]'),
    ).find((element) => element.offsetParent !== null) ?? null
  );
}

export function MonacoEditorPanel() {
  const { editorOpen, setEditorOpen } = useItems();
  const { executeShortcut } = useSpaceShortcuts();
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const executeShortcutRef = useRef(executeShortcut);
  const editorOpenRef = useRef(editorOpen);
  const shikiThemeRef = useRef('one-light');
  const historyTokenRef = useRef<string | null>(null);
  const restorationRef = useRef<ReturnType<typeof createBrowserEditorSheetRestoration> | null>(
    null,
  );
  const { resolvedTheme } = useTheme();
  const { state, isMobile } = useSidebar();
  const [editorHeight, setEditorHeight] = useState(DEFAULT_EDITOR_HEIGHT);
  const [hasOpened, setHasOpened] = useState(editorOpen);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [sheetViewport, setSheetViewport] = useState<EditorSheetViewport>({
    top: 0,
    height: 0,
    bottom: 0,
  });

  const isDark = resolvedTheme === 'dark';
  const shikiTheme = isDark ? 'catppuccin-macchiato' : 'one-light';
  const sidebarWidth = state === 'collapsed' ? '3rem' : '16rem';

  useLayoutEffect(() => {
    executeShortcutRef.current = executeShortcut;
    editorOpenRef.current = editorOpen;
    shikiThemeRef.current = shikiTheme;
  }, [editorOpen, executeShortcut, shikiTheme]);

  useEffect(() => {
    if (editorOpen) setHasOpened(true);
    if (!editorOpen && !isMobile) setEditorHeight(DEFAULT_EDITOR_HEIGHT);
  }, [editorOpen, isMobile]);

  useEffect(() => {
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(shikiTheme);
  }, [shikiTheme]);

  const closeMobileEditor = useCallback(() => {
    const token = historyTokenRef.current;
    historyTokenRef.current = null;
    setEditorOpen(false);

    if (token && ownsEditorSheetHistoryState(window.history.state, token)) {
      window.history.back();
    }
  }, [setEditorOpen]);

  const toggleEditorRegistration = useMemo(
    () => ({
      run: () => {
        if (editorOpen && isMobile) {
          closeMobileEditor();
          return;
        }
        setEditorOpen(!editorOpen);
      },
    }),
    [closeMobileEditor, editorOpen, isMobile, setEditorOpen],
  );

  const closeEditorRegistration = useMemo(
    () => ({
      active: editorOpen && isMobile,
      run: closeMobileEditor,
    }),
    [closeMobileEditor, editorOpen, isMobile],
  );

  useSpaceShortcut('editor.toggle', toggleEditorRegistration);
  useSpaceShortcut('editor.close', closeEditorRegistration);

  useLayoutEffect(() => {
    if (!editorOpen || !isMobile) return;

    const restoration =
      restorationRef.current ??
      (restorationRef.current = createBrowserEditorSheetRestoration());
    const focusTarget =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollRegions = document.querySelectorAll<HTMLElement>('[data-space-scroll-region]');
    restoration.capture(focusTarget, scrollRegions);

    const background = document.querySelector<HTMLElement>('[data-space-background]');
    const previousAriaHidden = background?.getAttribute('aria-hidden') ?? null;
    if (background) {
      background.inert = true;
      background.setAttribute('aria-hidden', 'true');
    }

    const token = `space-editor-${crypto.randomUUID()}`;
    historyTokenRef.current = token;
    window.history.pushState(
      createEditorSheetHistoryState(window.history.state, token),
      '',
      window.location.href,
    );

    const updateViewport = () => {
      const viewport = window.visualViewport;
      setSheetViewport(
        resolveEditorSheetViewport(
          window.innerHeight,
          viewport
            ? { height: viewport.height, offsetTop: viewport.offsetTop }
            : null,
        ),
      );
      window.requestAnimationFrame(() => editorInstanceRef.current?.layout());
    };

    const dismissFromHistory = () => {
      historyTokenRef.current = null;
      setEditorOpen(false);
    };

    updateViewport();
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    window.addEventListener('popstate', dismissFromHistory);

    return () => {
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('popstate', dismissFromHistory);

      if (background) {
        background.inert = false;
        if (previousAriaHidden === null) background.removeAttribute('aria-hidden');
        else background.setAttribute('aria-hidden', previousAriaHidden);
      }

      restoration.restore(visibleEditorTrigger());
    };
  }, [editorOpen, isMobile, setEditorOpen]);

  useEffect(() => {
    return () => restorationRef.current?.cancel();
  }, []);

  useEffect(() => {
    if (!hasOpened || !editorRef.current || editorInstanceRef.current) return;

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
    let editor: any;
    let contentSizeDisposable: { dispose: () => void } | undefined;

    const initEditor = async () => {
      (window as any).MonacoEnvironment = {
        getWorker() {
          return new Worker(
            URL.createObjectURL(
              new Blob(['self.onmessage = () => {}'], { type: 'text/javascript' }),
            ),
          );
        },
      };

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

      editor = monaco.editor.create(editorRef.current, {
        value: '',
        language: 'python',
        theme: shikiThemeRef.current,
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

      editorInstanceRef.current = editor;
      monaco.editor.setTheme(shikiThemeRef.current);
      setIsInitializing(false);

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
        executeShortcutRef.current('editor.toggle');
      });

      contentSizeDisposable = editor.onDidContentSizeChange(() => {
        if (window.matchMedia('(max-width: 767px)').matches) return;
        const contentHeight = editor.getContentHeight();
        const maxHeight = window.innerHeight - 112;
        const nextHeight = Math.max(
          DEFAULT_EDITOR_HEIGHT,
          Math.min(contentHeight + 32, maxHeight),
        );
        setEditorHeight(nextHeight);
      });

      if (editorOpenRef.current) editor.focus();
    };

    void initEditor().catch((error) => {
      console.error('Unable to initialize Monaco editor', error);
      if (disposed) return;
      setIsInitializing(false);
      setInitializationError('The editor could not open. Close it and try again.');
    });

    return () => {
      disposed = true;
      contentSizeDisposable?.dispose();
      editor?.dispose();
      editorInstanceRef.current = null;
    };
  }, [hasOpened]);

  useEffect(() => {
    if (!editorOpen || !editorInstanceRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      editorInstanceRef.current?.layout();
      editorInstanceRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editorOpen, isMobile, sheetViewport.height, sheetViewport.top]);

  if (!hasOpened && !editorOpen) return null;

  const mobileStyle = {
    left: 0,
    top: `${sheetViewport.top}px`,
    width: '100vw',
    height: sheetViewport.height ? `${sheetViewport.height}px` : '100dvh',
  };
  const desktopStyle = {
    left: `calc(${sidebarWidth} + 1rem)`,
    width: 'calc((100vw - var(--sidebar-width) - 2rem) / 2 - 0.375rem)',
    height: `${editorHeight}px`,
  };

  return (
    <section
      data-space-editor-sheet={isMobile ? 'true' : undefined}
      data-space-shortcut-scope="editor"
      role={isMobile && editorOpen ? 'dialog' : undefined}
      aria-modal={isMobile && editorOpen ? true : undefined}
      aria-labelledby={isMobile ? 'space-editor-title' : undefined}
      aria-describedby={isMobile ? 'space-editor-description' : undefined}
      aria-hidden={!editorOpen}
      className={`fixed z-[60] flex overflow-hidden bg-[#f4f1ea] text-[#383a42] shadow-2xl transition-opacity duration-150 motion-reduce:transition-none dark:bg-[#202126] dark:text-[#cad3f5] md:top-24 md:rounded-lg md:border md:border-border md:transition-[left,width,opacity] md:duration-200 md:ease-linear ${
        editorOpen ? 'visible pointer-events-auto opacity-100' : 'invisible pointer-events-none opacity-0'
      } ${isMobile ? 'inset-x-0 flex-col' : ''}`}
      style={isMobile ? mobileStyle : desktopStyle}
    >
      {isMobile ? (
        <header className="flex shrink-0 items-center gap-3 border-b border-black/10 px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] dark:border-white/10">
          <div className="min-w-0 flex-1">
            <h2 id="space-editor-title" className="truncate text-sm font-semibold">
              Code editor
            </h2>
            <p id="space-editor-description" className="text-xs text-black/55 dark:text-white/55">
              Unsaved code stays here when the sheet closes.
            </p>
          </div>
          <button
            type="button"
            data-space-editor-close
            onClick={closeMobileEditor}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-black/15 bg-white/70 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none dark:border-white/15 dark:bg-black/20 dark:hover:bg-black/35"
            aria-label="Close code editor"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
      ) : null}

      <div className="relative min-h-0 flex-1 pb-[env(safe-area-inset-bottom)] md:pb-0">
        {isInitializing ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f4f1ea] px-6 text-center dark:bg-[#202126]">
            <p className="animate-pulse text-sm text-[#383a42] motion-reduce:animate-none dark:text-[#cad3f5]">
              Opening a clean workbench…
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
              onClick={() => (isMobile ? closeMobileEditor() : setEditorOpen(false))}
              className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-sm font-medium text-black/75 transition hover:bg-black/[0.04] active:scale-[0.98] motion-reduce:transition-none dark:border-white/15 dark:bg-[#18191d] dark:text-white/80 dark:hover:bg-[#25262c]"
            >
              Close editor
            </button>
          </div>
        ) : null}

        <div ref={editorRef} className="h-full min-h-0 w-full" />
      </div>
    </section>
  );
}
