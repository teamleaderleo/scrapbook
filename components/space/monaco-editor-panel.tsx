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
  const { resolvedTheme } = useTheme();
  const { state } = useSidebar();
  const [editorHeight, setEditorHeight] = useState(384); // Default h-96 = 384px

  // Determine theme based on resolved theme
  const isDark = resolvedTheme === "dark";
  const shikiTheme = isDark ? "catppuccin-macchiato" : "one-light";

  // Calculate left position based on sidebar state
  const sidebarWidth = state === "collapsed" ? "3rem" : "16rem"; // Approximate sidebar widths

  useEffect(() => {
    if (!isOpen || !editorRef.current) return;

    // Inject CSS to disable italics
    const styleId = 'monaco-no-italics';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .monaco-editor .view-line span {
          font-style: normal !important;
        }
      `;
      document.head.appendChild(style);
    }

    let cleanup: (() => void) | undefined;

    const initEditor = async () => {
      // Configure Monaco environment for web workers (minimal setup)
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

      // Dynamically import Monaco and Shiki integration
      const [{ createHighlighter }, { shikiToMonaco }, monaco] = await Promise.all([
        import("shiki"),
        import("@shikijs/monaco"),
        import("monaco-editor"),
      ]);

      // Create Shiki highlighter with BOTH themes loaded upfront
      const highlighter = await createHighlighter({
        themes: ['one-light', 'catppuccin-macchiato'],
        langs: ["python"],
      });

      // Register Python language
      monaco.languages.register({ id: "python" });

      // Apply Shiki highlighting to Monaco
      shikiToMonaco(highlighter, monaco);

      // Create the editor
      const editor = monaco.editor.create(editorRef.current!, {
        value: "",
        language: "python",
        theme: shikiTheme,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 24, // 1.7 line spacing (14px * 1.7 ≈ 24px)
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 4,
        insertSpaces: true,
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        padding: {
          top: 16,
          bottom: 16,
        },
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
      });

      editorInstanceRef.current = editor;

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

    return () => {
      cleanup?.();
    };
  }, [isOpen, shikiTheme]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-50 border border-border rounded-lg shadow-2xl transition-all top-24 overflow-hidden"
      style={{
        left: `calc(${sidebarWidth} + 1rem)`,
        width: 'calc((100vw - var(--sidebar-width) - 2rem) / 2 - 0.375rem)',
        backgroundColor: isDark ? '#24273a' : '#fafafa',
        height: `${editorHeight}px`,
      }}
    >
      <div ref={editorRef} className="h-full w-full" />
    </div>
  );
}