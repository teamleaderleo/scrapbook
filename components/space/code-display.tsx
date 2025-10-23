"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CodeDisplay({
  code,
  codeHtml,
  title = "Code",
  className = "",
}: {
  code?: string;
  codeHtml?: string;
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If no pre-rendered HTML, show fallback
  if (!codeHtml) {
    return (
      <div className={`flex-1 min-w-0 max-w-full ${className}`}>
        <div className="border border-border rounded overflow-auto">
          <pre className="font-mono text-sm p-3 m-0">
            <code>{code || 'No code'}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 min-w-0 max-w-full ${className}`}>
      <div className="relative border border-border rounded overflow-auto h-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCode}
          className="absolute top-2 right-2 h-6 px-2 z-10 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>

        {/* Shiki renders its own backgrounds */}
        <div 
          className="[&_pre]:m-0 [&_pre]:p-3 [&_code]:text-sm [&_pre]:whitespace-pre-wrap [&_code]:whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: codeHtml }}
        />
      </div>
    </div>
  );
}