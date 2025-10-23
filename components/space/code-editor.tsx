"use client";
import { useRef, useState, useEffect } from "react";
import { createHighlighter } from "shiki";
import { useTheme } from "next-themes";

let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null;
let highlighterPromise: Promise<Awaited<ReturnType<typeof createHighlighter>>> | null = null;

async function getHighlighter() {
  if (highlighterInstance) return highlighterInstance;
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["one-light", "catppuccin-macchiato"],
      langs: ["python", "javascript", "typescript", "jsx", "tsx", "bash", "sql", "json"],
    });
  }
  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

export function CodeEditor({
  value,
  onChange,
  language = "python",
  placeholder = "def solution():\n  # code",
}: {
  value: string;
  onChange: (v: string) => void;
  language?: string;
  placeholder?: string;
}) {
  const { resolvedTheme } = useTheme();
  const highlightRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const isDark = resolvedTheme !== "light";

  useEffect(() => {
    const highlight = async () => {
      const highlighter = await getHighlighter();
      // Always render highlighted HTML (use a single space when empty)
      const html = highlighter.codeToHtml(value || " ", {
        lang: language,
        themes: { light: "one-light", dark: "catppuccin-macchiato" },
        defaultColor: false, // keep token colors only; we paint the bg ourselves
      });
      setHighlightedHtml(html);
    };
    highlight();
  }, [value, language, isDark]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold mb-2 text-foreground">Code</h2>

      <div className="relative border border-border rounded flex-1 min-h-[14rem] overflow-hidden">
        {/* Syntax-highlighted layer */}
        <div
          ref={highlightRef}
          className={`absolute inset-0 overflow-auto pointer-events-none
                     [&_pre]:m-0 [&_pre]:p-3 [&_pre]:text-sm [&_pre]:leading-[1.7]
                     [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:font-mono
                     [&_code]:text-sm [&_code]:leading-[1.7] [&_code]:whitespace-pre-wrap
                     [&_code]:break-words [&_code]:font-mono
                     ${!isDark ? '[&_pre]:!bg-white [&_span]:!bg-transparent' : ''}`}
          style={{ backgroundColor: isDark ? '#24273a' : '#ffffff' }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />

        {/* Editing layer */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full p-3 bg-transparent text-transparent
                     resize-none outline-none caret-black dark:caret-white font-mono
                     text-sm leading-[1.7] whitespace-pre-wrap break-words"
          style={{ tabSize: 4 }}
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>
    </div>
  );
}