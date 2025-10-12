"use client";
import Link from "next/link";
import { Rating } from "ts-fsrs";
import { Button } from "@/components/ui/button";
import type { Item } from "@/app/lib/item-types";
import { formatInterval, formatDueRelative } from "@/app/lib/interval-format";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSearchParams } from "next/navigation";
import { useItems } from "@/app/lib/contexts/item-context";
import { useTheme } from "next-themes";

export function ResultsClient({
  items,
  onReview,
  onEnroll,
  nowMs,
}: {
  items: Item[];
  onReview: (id: string, rating: Rating) => void;
  onEnroll: (id: string) => void;
  nowMs: number;
}) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <Row key={it.id} it={it} onReview={onReview} onEnroll={onEnroll} nowMs={nowMs} />
      ))}
    </ul>
  );
}

function Row({ 
  it, 
  onReview, 
  onEnroll,
  nowMs 
}: { 
  it: Item; 
  onReview: (id: string, r: Rating) => void; 
  onEnroll: (id: string) => void;
  nowMs: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { isAdmin } = useItems();
  const { theme } = useTheme();
  const displayTags = it.tags.map(t => t.includes(':') ? t.split(':')[1] : t);
  const sp = useSearchParams();
  const tagsParam = sp.get("tags") ?? ""; 

  return (
    <li className="rounded border
               bg-white dark:bg-sidebar
               border-border dark:border-sidebar-border
               text-foreground dark:text-sidebar-foreground
               transition-colors">
      {/* Clickable header */}
      <div 
        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {it.url ? (
              <Link 
                href={it.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium hover:underline text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                {it.title}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{it.title}</span>
            )}
            {/* Only show edit/duplicate buttons if admin */}
            {isAdmin && (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/space/edit/${it.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    edit
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/space/add?duplicate=${it.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    duplicate
                  </Link>
                </Button>
              </>
            )}
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/space/review?tags=${tagsParam}&item=${it.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                review
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground capitalize">{it.category}</span>
            <span className="text-sm text-muted-foreground">{expanded ? '▼' : '▶'}</span>
          </div>
        </div>

        <div className="mt-1 text-xs text-muted-foreground">
          tags: {displayTags.join(", ")}
          {it.review && (
            <>
              {" · next: "}
              {formatDueRelative(nowMs, new Date(it.review.due))}
              {" · ivl: "}
              {formatInterval(nowMs, new Date(it.review.due), it.review.scheduled_days)}
              {it.review.due <= nowMs && (
                <span className="ml-2 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1 py-0.5">due</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border p-3">
          <div className="flex gap-3">
            {/* Writeup */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-2 text-foreground">Writeup</h3>
              <div className="p-3 rounded max-h-96 overflow-auto prose prose-sm dark:prose-invert max-w-none
                bg-white dark:bg-sidebar
                border border-border dark:border-sidebar-border">
                <ReactMarkdown>{it.content || '*No writeup yet*'}</ReactMarkdown>
              </div>
            </div>

            {/* Code */}
            {it.code && (
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-2 text-foreground">Code</h3>
                <div
                  className={`border border-border rounded max-h-96 overflow-auto ${
                    theme === 'dark' ? 'bg-card' : 'bg-white'
                  }`}
                >
                  <SyntaxHighlighter
                    language="python"
                    // Use dark theme as-is; light theme with transparent bg
                    style={
                      theme === 'dark'
                        ? vscDarkPlus
                        : {
                            ...oneLight,
                            hljs: { ...(oneLight as any).hljs, background: 'transparent' },
                          }
                    }
                    customStyle={{
                      margin: 0,
                      background: 'transparent',
                      padding: '0.75rem',
                      fontSize: 14,          // <-- same size in BOTH modes
                      lineHeight: 1.3,       // consistent line height
                    }}
                    codeTagProps={{ style: { background: 'transparent', fontSize: 'inherit' } }}
                    PreTag="div"
                    className="leading-tight" // no theme-based size differences
                  >
                    {it.code}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review controls - only visible for admin */}
      {isAdmin && (
      <div className="border-t border-border p-3" onClick={(e) => e.stopPropagation()}>
        {!it.review ? (
          <button 
            className="rounded border border-border px-2 py-1 text-xs hover:bg-muted transition-colors"
            onClick={() => onEnroll(it.id)}
          >
            Add to reviews
          </button>
        ) : (
          <div className="flex gap-2 text-xs">
            <button className="rounded border border-border px-2 py-1 hover:bg-muted transition-colors" onClick={() => onReview(it.id, Rating.Again)}>Again</button>
            <button className="rounded border border-border px-2 py-1 hover:bg-muted transition-colors" onClick={() => onReview(it.id, Rating.Hard)}>Hard</button>
            <button className="rounded border border-border px-2 py-1 hover:bg-muted transition-colors" onClick={() => onReview(it.id, Rating.Good)}>Good</button>
            <button className="rounded border border-border px-2 py-1 hover:bg-muted transition-colors" onClick={() => onReview(it.id, Rating.Easy)}>Easy</button>
          </div>
        )}
      </div>
    )}
    </li>
  );
}