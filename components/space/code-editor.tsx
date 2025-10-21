"use client";
import { useRef, useState, useEffect } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"; // Changed!
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

// Prism python
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";

SyntaxHighlighter.registerLanguage('python', python);

export function CodeEditor({
  value,
  onChange,
  language = "python",
  placeholder = "function solution() {\n  // code\n}",
}: {
  value: string;
  onChange: (v: string) => void;
  language?: string;
  placeholder?: string;
}) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const highlightRef = useRef<HTMLDivElement>(null);
  const isDark = (resolvedTheme ?? theme) === "dark";

  const METRICS = {
    padding: "0.75rem",
    fontSize: 14,
    lineHeight: 1.3,
    tabSize: 4 as unknown as number,
    fontFamily:
      'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold mb-2 text-foreground">Code</h2>

      <div className="relative border border-border rounded flex-1 overflow-hidden bg-background max-w-full">
        {mounted && (
          <div ref={highlightRef} className="absolute inset-0 overflow-auto pointer-events-none max-w-full">
            <SyntaxHighlighter
              language={language}
              style={isDark ? vscDarkPlus : oneLight}
              customStyle={{
                margin: 0,
                background: "transparent",
                padding: METRICS.padding,
                fontSize: METRICS.fontSize,
                lineHeight: METRICS.lineHeight,
                fontFamily: METRICS.fontFamily,
                tabSize: METRICS.tabSize,
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                maxWidth: "100%",
              }}
              codeTagProps={{
                style: {
                  background: "transparent",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                },
              }}
              PreTag="pre"
              className="leading-tight max-w-full"
            >
              {value || " "}
            </SyntaxHighlighter>
          </div>
        )}

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            if (highlightRef.current) {
              highlightRef.current.scrollTop = e.currentTarget.scrollTop;
              highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
          className="absolute inset-0 w-full h-full p-3 font-mono text-sm bg-transparent
                     text-transparent resize-none outline-none leading-tight
                     caret-black dark:caret-white max-w-full"
          style={{
            fontSize: METRICS.fontSize,
            lineHeight: METRICS.lineHeight,
            padding: METRICS.padding,
            tabSize: METRICS.tabSize,
            fontFamily: METRICS.fontFamily,
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>
    </div>
  );
}