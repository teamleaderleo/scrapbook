"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface MonacoEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MonacoEditorPanel({ isOpen, onClose }: MonacoEditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  // Determine theme based on resolved theme
  const isDark = resolvedTheme === "dark";
  const shikiTheme = isDark ? "catppuccin-mocha" : "one-light";

  useEffect(() => {
    if (!isOpen || !editorRef.current) return;

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

      // Create Shiki highlighter with your themes
      const highlighter = await createHighlighter({
        themes: [shikiTheme],
        langs: ["python"],
      });

      // Register Python language
      monaco.languages.register({ id: "python" });

      // Apply Shiki highlighting to Monaco
      shikiToMonaco(highlighter, monaco);

      // Create the editor
      const editor = monaco.editor.create(editorRef.current!, {
        value: "# Write your Python code here\n\n",
        language: "python",
        theme: shikiTheme,
        automaticLayout: true,
        minimap: { enabled: false }, // Disabled
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 4,
        insertSpaces: true,
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
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
    <div className="fixed z-50 bg-background border border-border rounded-lg shadow-2xl transition-all left-1/2 -translate-x-1/2 top-20 w-[calc(100%-12rem)] max-w-4xl h-[600px]">
      <div ref={editorRef} className="h-full w-full rounded-lg overflow-hidden" />
    </div>
  );
}