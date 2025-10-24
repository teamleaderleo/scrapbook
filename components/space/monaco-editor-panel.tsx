"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useSidebar } from "@/components/ui/sidebar";

interface MonacoEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MonacoEditorPanel({ isOpen, onClose }: MonacoEditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const highlighterRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const { state } = useSidebar();
  const [editorHeight, setEditorHeight] = useState(384);

  // Determine theme based on resolved theme
  const isDark = resolvedTheme === "dark";
  const shikiTheme = isDark ? "catppuccin-macchiato" : "one-light";

  // Calculate left position based on sidebar state
  const sidebarWidth = state === "collapsed" ? "3rem" : "16rem";

  // --- Theme switching: switch Monaco theme only (no re-register) ---
  useEffect(() => {
    if (!editorInstanceRef.current || !monacoRef.current || !highlighterRef.current) return;

    const monaco = monacoRef.current;
    const highlighter = highlighterRef.current;

    // Safety: ensure the theme is present in the highlighter, but DO NOT call shikiToMonaco again
    try {
      const loaded = highlighter.getLoadedThemes?.() || [];
      if (!loaded.includes(shikiTheme)) {
        // Load into Shiki for completeness; Monaco theme definitions were already created at init
        highlighter.loadTheme?.(shikiTheme).catch(() => {});
      }
    } catch {}

    // Switch the live editor theme
    if (monaco.editor) {
      monaco.editor.setTheme(shikiTheme);
    } else {
      editorInstanceRef.current.updateOptions({ theme: shikiTheme });
    }
  }, [shikiTheme]);

  useEffect(() => {
    if (!isOpen || !editorRef.current) return;

    // Inject CSS to disable italics in tokens (cosmetic)
    const styleId = "monaco-no-italics";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .monaco-editor .view-line span { font-style: normal !important; }
      `;
      document.head.appendChild(style);
    }

    let cleanup: (() => void) | undefined;

    const initEditor = async () => {
      // Minimal worker wiring (prevents network fetches for workers in this embed)
      if (typeof window !== "undefined") {
        (window as any).MonacoEnvironment = {
          getWorker() {
            return new Worker(
              URL.createObjectURL(
                new Blob(["self.onmessage = () => {}"], { type: "text/javascript" })
              )
            );
          },
        };
      }

      // Load Monaco + Shiki integration
      const [
        { createHighlighter },
        { shikiToMonaco },
        // registers python tokens provider (tree-shaken if unnecessary)
        _pythonContribution,
        monaco,
      ] = await Promise.all([
        import("shiki"),
        import("@shikijs/monaco"),
        import("monaco-editor/esm/vs/basic-languages/python/python.contribution"),
        import("monaco-editor"),
      ]);

      // Create a highlighter with BOTH themes up-front; register once
      const highlighter = await createHighlighter({
        themes: ["one-light", "catppuccin-macchiato"],
        langs: ["python"],
      });

      highlighterRef.current = highlighter;
      monacoRef.current = monaco;

      // Optional: ensure language is registered (harmless if already present)
      monaco.languages.register?.({ id: "python" });

      // Register Shiki themes with Monaco ONE TIME ONLY
      shikiToMonaco(highlighter, monaco);

      // Create the editor
      const editor = monaco.editor.create(editorRef.current!, {
        value: "",
        language: "python",
        theme: shikiTheme,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 24,
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 4,
        insertSpaces: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        padding: { top: 16, bottom: 16 },
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
      });

      editorInstanceRef.current = editor;
      monaco.editor.setTheme(shikiTheme);

      // Add keybinding for Ctrl+I to close editor
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
        onClose();
      });

      // Focus the editor immediately
      editor.focus();

      // Adjust height based on content
      editor.onDidContentSizeChange(() => {
        const contentHeight = editor.getContentHeight();
        // Calculate max height: viewport height - top position (96px) - bottom margin (16px)
        const maxHeight = window.innerHeight - 96 - 16;
        const newHeight = Math.max(384, Math.min(contentHeight + 32, maxHeight));
        setEditorHeight(newHeight);
      });

      cleanup = () => {
        editor.dispose();
      };
    };

    initEditor().catch(console.error);
    return () => cleanup?.();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 border border-border rounded-lg shadow-2xl transition-all top-24 overflow-hidden"
      style={{
        left: `calc(${sidebarWidth} + 1rem)`,
        width: 'calc((100vw - var(--sidebar-width) - 2rem) / 2 - 0.375rem)',
        height: `${editorHeight}px`,
      }}
    >
      <div ref={editorRef} className="h-full w-full" />
    </div>
  );
}
