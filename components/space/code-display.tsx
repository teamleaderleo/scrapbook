"use client";
import { useState } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

import python from "react-syntax-highlighter/dist/esm/languages/prism/python";

SyntaxHighlighter.registerLanguage('python', python);

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
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  // Default to dark if theme not resolved yet (avoids flash)
  const isDark = resolvedTheme !== "light";

  const METRICS = {
    padding: "0.75rem",
    fontSize: 14,
    lineHeight: 1.3,
    tabSize: 4 as unknown as number,
    fontFamily:
      'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex-1 min-w-0 max-w-full ${className}`}>
      <h3 className="text-sm font-semibold mb-2 text-foreground">{title}</h3>
      <div className="relative border border-border rounded max-h-96 max-w-full overflow-auto bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCode}
          className="absolute top-2 right-2 h-6 px-2 z-10"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>

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
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}