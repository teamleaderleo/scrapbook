"use client";
import { CodeDisplay } from "./code-display";

interface ItemPreviewProps {
  item: {
    title: string;
    tags?: string[];
    category: string;
    url?: string;
  };
  content: string;
  code?: string;
}

export function ItemPreview({ item, content, code }: ItemPreviewProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2 text-foreground">Preview</h2>
      <div className="rounded p-4 space-y-2 h-96 overflow-auto
        bg-white dark:bg-sidebar
        border border-border dark:border-sidebar-border
        text-foreground dark:text-sidebar-foreground">
        <div><strong>Title:</strong> {item.title}</div>
        <div><strong>Tags:</strong> {item.tags?.join(', ')}</div>
        <div><strong>Category:</strong> {item.category}</div>
        {item.url && <div><strong>URL:</strong> {item.url}</div>}
        
        <div className="border-t border-border dark:border-sidebar-border pt-2 mt-2">
          <strong>Content:</strong>
          <pre className="text-xs mt-1 whitespace-pre-wrap">
            {content || <span className="text-muted-foreground">No content</span>}
          </pre>
        </div>
        
        {code && <CodeDisplay code={code} />}
      </div>
    </div>
  );
}