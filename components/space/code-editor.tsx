"use client";
import { useRef, useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

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

  return (
    <div>
      <h2 className="text-sm font-semibold mb-2 text-foreground">Code</h2>

      <div
        className="relative border border-border rounded h-96 overflow-hidden bg-background"  // CSS decides, not JS!!!
      >
        {/* Only mount the heavy highlighter after mount so we can pick theme safely */}
        {mounted && (
          <div ref={highlightRef} className="absolute inset-0 overflow-auto pointer-events-none">
            <SyntaxHighlighter
              language={language}
              style={isDark ? vscDarkPlus : oneLight}
              customStyle={{
                margin: 0,
                background: "transparent",
                padding: "0.75rem",
                fontSize: 14,
                lineHeight: 1.3,
              }}
              codeTagProps={{ style: { background: "transparent", fontSize: "inherit" } }}
              PreTag="div"
              className="leading-tight"
            >
              {value || " "}
            </SyntaxHighlighter>
          </div>
        )}

        {/* Transparent textarea overlay – no JS-based styling */}
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
                     caret-black dark:caret-white"  // no inline style; CSS-only
          style={{
            // Keep only invariants here; avoid theme-dependent inline styles on first render
            fontSize: 14,
            lineHeight: 1.3,
            padding: "0.75rem",
            tabSize: 4,
            fontFamily:
              'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
