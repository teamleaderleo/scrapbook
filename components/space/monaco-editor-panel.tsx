'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
import styles from './monaco-editor-panel.module.css';

function collectScrollableSpaceRegions() {
  const root = document.querySelector<HTMLElement>('[data-space-background]');
  if (!root) return [];

  return [root, ...root.querySelectorAll<HTMLElement>('*')].filter(element => {
    const style = getComputedStyle(element);
    const scrollable = /^(auto|scroll)$/.test(style.overflowY);
    return scrollable && element.scrollHeight > element.clientHeight;
  });
}

function visibleEditorTrigger() {
  return [...document.querySelectorAll<HTMLElement>('[data-space-editor-trigger]')].find(
    element => element.getClientRects().length > 0
  );
}

function pushNativeSameUrlHistoryState(state: unknown) {
  window.History.prototype.pushState.call(
    window.history,
    state,
    '',
    window.location.href
  );
}

export function MonacoEditorPanel() {
  const { editorOpen, setEditorOpen } = useItems();
  const { executeShortcut } = useSpaceShortcuts();
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const editorOpenRef = useRef(editorOpen);
  const restorationRef = useRef<ReturnType<
    typeof createBrowserEditorSheetRestoration
  > | null>(null);
  const historyToken = useId();
  const { resolvedTheme } = useTheme();
  const { state, isMobile } = useSidebar();
  const [editorHeight, setEditorHeight] = useState(384);
  const [hasMountedEditor, setHasMountedEditor] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [mobileViewport, setMobileViewport] = useState<EditorSheetViewport>(() => ({
    top: 0,
    height: 0,
    bottom: 0,
  }));

  const isDark = resolvedTheme === 'dark';
  const shikiTheme = isDark ? 'catppuccin-macchiato' : 'one-light';
  const shikiThemeRef = useRef(shikiTheme);
  const sidebarWidth = state === 'collapsed' ? '3rem' : '16rem';

  useEffect(() => {
    editorOpenRef.current = editorOpen;
  }, [editorOpen]);

  useEffect(() => {
    shikiThemeRef.current = shikiTheme;
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(shikiTheme);
  }, [shikiTheme]);

  useEffect(() => {
    if (!hasMountedEditor || editorInstanceRef.current || !editorRef.current) {
      return;
    }

    setIsInitializing(true);
    setInitializationError(null);

    const styleId = 'monaco-no-italics';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent =
        '.monaco-editor .view-line span { font-style: normal !important; }';
      document.head.appendChild(style);
    }

    let disposed = false;

    const initEditor = async () => {
      (window as any).MonacoEnvironment = {
        getWorker() {
          return new Worker(
            URL.createObjectURL(
              new Blob(['self.onmessage = () => {}'], {
                type: 'text/javascript',
              })
            )
          );
        },
      };

      const [
        { createHighlighter },
        { shikiToMonaco },
        _pythonContribution,
        monaco,
      ] = await Promise.all([
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
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        padding: { top: 16, bottom: 16 },
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
      });

      editorInstanceRef.current = editor;
      monaco.editor.setTheme(shikiThemeRef.current);
      setIsInitializing(false);

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
        executeShortcut('editor.toggle');
      });

      editor.onDidContentSizeChange(() => {
        const contentHeight = editor.getContentHeight();
        const maxHeight = window.innerHeight - 112;
        setEditorHeight(Math.max(384, Math.min(contentHeight + 32, maxHeight)));
      });

      if (editorOpenRef.current) editor.focus();
    };

    void initEditor().catch(error => {
      console.error('Unable to initialize Monaco editor', error);
      if (disposed) return;
      setIsInitializing(false);
      setInitializationError('The editor could not open. Close it and try again.');
    });

    return () => {
      disposed = true;
      editorInstanceRef.current?.dispose();
      editorInstanceRef.current = null;
    };
  }, [executeShortcut, hasMountedEditor]);

  useEffect(() => {
    if (!editorOpen) return;

    if (editorInstanceRef.current) {
      editorInstanceRef.current.layout();
      editorInstanceRef.current.focus();
      return;
    }

    if (isMobile) {
      const frame = requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>('[data-space-editor-close]')
          ?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [editorOpen, isMobile, mobileViewport.height]);

  const restoreBackground = useCallback(() => {
    for (const element of document.querySelectorAll<HTMLElement>(
      '[data-space-background], [data-space-mobile-actions]'
    )) {
      element.removeAttribute('inert');
      element.removeAttribute('aria-hidden');
    }
  }, []);

  const restoreAfterClose = useCallback(() => {
    restoreBackground();
    restorationRef.current?.restore(visibleEditorTrigger() ?? null);
  }, [restoreBackground]);

  const closeEditor = useCallback(() => {
    if (isMobile && ownsEditorSheetHistoryState(history.state, historyToken)) {
      history.back();
      return;
    }

    setEditorOpen(false);
    restoreAfterClose();
  }, [historyToken, isMobile, restoreAfterClose, setEditorOpen]);

  const openEditor = useCallback(() => {
    if (editorOpen) return;

    if (isMobile) {
      restorationRef.current ??= createBrowserEditorSheetRestoration();
      restorationRef.current.capture(
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null,
        collectScrollableSpaceRegions()
      );

      if (!ownsEditorSheetHistoryState(history.state, historyToken)) {
        pushNativeSameUrlHistoryState(
          createEditorSheetHistoryState(history.state, historyToken)
        );
      }
    }

    setHasMountedEditor(true);
    setEditorOpen(true);
  }, [editorOpen, historyToken, isMobile, setEditorOpen]);

  const toggleEditor = useMemo(
    () => ({
      run: () => {
        if (editorOpen) closeEditor();
        else openEditor();
      },
    }),
    [closeEditor, editorOpen, openEditor]
  );
  const closeEditorShortcut = useMemo(
    () => ({
      active: isMobile && editorOpen,
      run: closeEditor,
    }),
    [closeEditor, editorOpen, isMobile]
  );

  useSpaceShortcut('editor.toggle', toggleEditor);
  useSpaceShortcut('editor.close', closeEditorShortcut);

  useEffect(() => {
    if (!isMobile) return;

    const onPopState = () => {
      const owned = ownsEditorSheetHistoryState(history.state, historyToken);

      if (owned && !editorOpen) {
        restorationRef.current ??= createBrowserEditorSheetRestoration();
        restorationRef.current.capture(
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null,
          collectScrollableSpaceRegions()
        );
        setHasMountedEditor(true);
        setEditorOpen(true);
        return;
      }

      if (!owned && editorOpen) {
        setEditorOpen(false);
        restoreAfterClose();
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [editorOpen, historyToken, isMobile, restoreAfterClose, setEditorOpen]);

  useEffect(() => {
    if (!isMobile || !editorOpen) {
      restoreBackground();
      return;
    }

    for (const element of document.querySelectorAll<HTMLElement>(
      '[data-space-background], [data-space-mobile-actions]'
    )) {
      element.setAttribute('inert', '');
      element.setAttribute('aria-hidden', 'true');
    }

    return restoreBackground;
  }, [editorOpen, isMobile, restoreBackground]);

  useEffect(() => {
    if (!isMobile || !editorOpen) return;

    const updateViewport = () => {
      const viewport = window.visualViewport;
      setMobileViewport(
        resolveEditorSheetViewport(
          window.innerHeight,
          viewport
            ? { height: viewport.height, offsetTop: viewport.offsetTop }
            : null
        )
      );
    };

    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [editorOpen, isMobile]);

  useEffect(
    () => () => {
      restorationRef.current?.cancel();
      restoreBackground();
    },
    [restoreBackground]
  );

  if (!hasMountedEditor) return null;

  return (
    <section
      role={isMobile ? 'dialog' : undefined}
      aria-modal={isMobile ? true : undefined}
      aria-labelledby={isMobile ? 'space-code-editor-title' : undefined}
      className={`${styles.panel} z-50 flex flex-col overflow-hidden border border-border bg-background shadow-2xl transition-[left,width] duration-200 ease-linear motion-reduce:transition-none ${
        isMobile ? 'rounded-none' : 'rounded-lg'
      } ${editorOpen ? '' : 'hidden'}`}
      style={
        {
          '--editor-left': `calc(${sidebarWidth} + 1rem)`,
          '--editor-width': `calc((100vw - ${sidebarWidth} - 2rem) / 2 - 0.375rem)`,
          '--editor-height': `${editorHeight}px`,
          '--mobile-editor-top': `${mobileViewport.top}px`,
          '--mobile-editor-height': mobileViewport.height
            ? `${mobileViewport.height}px`
            : '100dvh',
        } as CSSProperties
      }
      data-space-editor-panel
      data-space-editor-mobile={isMobile ? 'true' : 'false'}
      data-space-shortcut-scope="editor"
    >
      {isMobile ? (
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <h2 id="space-code-editor-title" className="text-sm font-semibold">
              Code editor
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Draft stays here while the sheet is dismissed.
            </p>
          </div>
          <button
            type="button"
            onClick={closeEditor}
            data-space-editor-close
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close code editor"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
      ) : null}

      <div
        className={`${isMobile ? 'pb-[env(safe-area-inset-bottom)]' : ''} relative min-h-0 flex-1`}
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
              onClick={closeEditor}
              className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-sm font-medium text-black/75 transition hover:bg-black/[0.04] active:scale-[0.98] dark:border-white/15 dark:bg-[#18191d] dark:text-white/80 dark:hover:bg-[#25262c]"
            >
              Close editor
            </button>
          </div>
        ) : null}

        <div ref={editorRef} className="h-full w-full" />
      </div>
    </section>
  );
}
