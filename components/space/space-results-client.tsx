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
import { useSearchParams } from "next/navigation";

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
  const displayTags = it.tags.map(t => t.includes(':') ? t.split(':')[1] : t);
  const sp = useSearchParams();
  const tagsParam = sp.get("tags") ?? ""; 

  return (
    <li className="rounded border">
      {/* Clickable header */}
      <div 
        className="p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {it.url ? (
              <Link 
                href={it.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {it.title}
              </Link>
            ) : (
              <span className="font-medium">{it.title}</span>
            )}
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
            <span className="text-sm">{expanded ? '▼' : '▶'}</span>
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
                <span className="ml-2 rounded bg-red-100 text-red-700 px-1 py-0.5">due</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t p-3">
          <div className="flex gap-3">
            {/* Writeup */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-2 text-black">Writeup</h3>
              <div className="p-3 bg-gray-50 rounded max-h-96 overflow-auto prose prose-sm max-w-none text-black">
                <ReactMarkdown>{it.content || '*No writeup yet*'}</ReactMarkdown>
              </div>
            </div>

            {/* Code */}
            {it.code && (
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-2 text-black">Code</h3>
                <div className="bg-gray-900 rounded max-h-96 overflow-auto">
                  <SyntaxHighlighter 
                    language="python"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, background: 'transparent', padding: '0.75rem' }}
                    className="text-sm"
                  >
                    {it.code}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review controls - always visible */}
      <div className="border-t p-3" onClick={(e) => e.stopPropagation()}>
        {!it.review ? (
          <button 
            className="rounded border px-2 py-1 text-xs hover:bg-gray-100"
            onClick={() => onEnroll(it.id)}
          >
            Add to reviews
          </button>
        ) : (
          <div className="flex gap-2 text-xs">
            <button className="rounded border px-2 py-1 hover:bg-gray-100" onClick={() => onReview(it.id, Rating.Again)}>Again</button>
            <button className="rounded border px-2 py-1 hover:bg-gray-100" onClick={() => onReview(it.id, Rating.Hard)}>Hard</button>
            <button className="rounded border px-2 py-1 hover:bg-gray-100" onClick={() => onReview(it.id, Rating.Good)}>Good</button>
            <button className="rounded border px-2 py-1 hover:bg-gray-100" onClick={() => onReview(it.id, Rating.Easy)}>Easy</button>
          </div>
        )}
      </div>
    </li>
  );
}