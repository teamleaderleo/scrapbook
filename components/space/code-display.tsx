"use client";
import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

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
  const [copied, setCopied] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = (resolvedTheme ?? theme) === "dark";

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <h3 className="text-sm font-semibold mb-2 text-foreground">{title}</h3>
      <div className="relative border border-border rounded max-h-96 overflow-auto bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCode}
          className="absolute top-2 right-2 h-6 px-2 z-10"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
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
          <pre 
            className="m-0 p-3 whitespace-pre-wrap text-foreground font-mono" 
            style={{ fontSize: 14, lineHeight: 1.3 }}
          >
            {code}
          </pre>
        )}
      </div>
    </div>
  );
}