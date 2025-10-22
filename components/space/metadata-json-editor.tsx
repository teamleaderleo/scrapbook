"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, ClipboardPaste, Check } from "lucide-react";

export interface MetadataJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onFocus?: () => void;
  onBlur?: () => void;

  /** Called after a successful clipboard paste so the parent can commit the value. */
  onPasted?: (value: string) => void;
}

export function MetadataJsonEditor({
  value,
  onChange,
  error,
  onFocus,
  onBlur,
  onPasted,
}: MetadataJsonEditorProps) {
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text != null) {
        // ensure local UI updates and parent is notified of a committed paste
        onFocus?.();
        onChange(text);
        onPasted?.(text);
        setPasted(true);
        setTimeout(() => setPasted(false), 1200);
      }
    } catch (e) {
      console.error("Clipboard paste failed", e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">Metadata</h2>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handleCopy}
            title="Copy metadata JSON"
            aria-label="Copy metadata JSON"
          >
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            <span className="text-xs hidden sm:inline">{copied ? "Copied" : "Copy metadata"}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handlePaste}
            title="Paste into metadata JSON"
            aria-label="Paste into metadata JSON"
          >
            <ClipboardPaste className="h-3 w-3 mr-1" />
            <span className="text-xs hidden sm:inline">{pasted ? "Pasted" : "Paste metadata"}</span>
          </Button>
        </div>
      </div>

      {error && <div className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</div>}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full h-96 p-3 rounded font-mono text-sm
          bg-muted/50 dark:bg-sidebar/50
          border border-border dark:border-sidebar-border
          text-foreground dark:text-sidebar-foreground
          focus:outline-none focus:ring-2 focus:ring-ring"
        spellCheck={false}
      />
    </div>
  );
}
