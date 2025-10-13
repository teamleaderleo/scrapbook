"use client";
import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

export function CodeDisplay({
  code,
  language = "python",
  title = "Code",
  className = "",
}: {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <h3 className="text-sm font-semibold mb-2 text-foreground">{title}</h3>
      <div className="border border-border rounded max-h-96 overflow-auto bg-background">
        {mounted ? (
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
            {code}
          </SyntaxHighlighter>
        ) : (
          // SSR-safe fallback that won’t mismatch
          <pre className="m-0 p-3 text-xs whitespace-pre-wrap text-foreground">{code}</pre>
        )}
      </div>
    </div>
  );
}
