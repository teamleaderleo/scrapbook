"use client";
import Link from "next/link";
import { Rating } from "ts-fsrs";
import { Button } from "@/components/ui/button";
import type { Item } from "@/app/lib/item-types";
import { formatInterval, formatDueRelative } from "@/app/lib/interval-format";
import { useEffect, useState } from "react";
import { MarkdownContent } from "./markdown-content";
import { useSearchParams } from "next/navigation";
import { CodeDisplay } from "./code-display";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ResultsClient({
  items,
  onReview,
  onEnroll,
  nowMs,
  isAdmin,
}: {
  items: Item[];
  onReview: (id: string, rating: Rating) => void;
  onEnroll: (id: string) => void;
  nowMs: number;
  isAdmin: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Toggle the currently hovered row when Shift is pressed
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ignore if typing
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const role = target?.getAttribute?.("role");
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        target?.getAttribute("contenteditable") === "true" ||
        role === "textbox";

      if (isTyping) return;

      if (e.key === "Shift" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat) {
        if (hoveredId) {
          setExpandedIds((prev) => ({ ...prev, [hoveredId]: !prev[hoveredId] }));
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hoveredId]);

  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const expanded = !!expandedIds[it.id];
        const onToggle = () =>
          setExpandedIds((prev) => ({ ...prev, [it.id]: !prev[it.id] }));

        return (
          <Row
            key={it.id}
            it={it}
            onReview={onReview}
            onEnroll={onEnroll}
            nowMs={nowMs}
            isAdmin={isAdmin}
            expanded={expanded}
            onToggle={onToggle}
            onHoverChange={(isHovering) => setHoveredId(isHovering ? it.id : (hoveredId === it.id ? null : hoveredId))}
          />
        );
      })}
    </ul>
  );
}

function Row({
  it,
  onReview,
  onEnroll,
  nowMs,
  isAdmin,
  expanded,
  onToggle,
  onHoverChange,
}: {
  it: Item;
  onReview: (id: string, r: Rating) => void;
  onEnroll: (id: string) => void;
  nowMs: number;
  isAdmin: boolean;
  expanded: boolean;
  onToggle: () => void;
  onHoverChange: (hovering: boolean) => void;
}) {
  const displayTags = it.tags.map((t) => (t.includes(":") ? t.split(":")[1] : t));
  const sp = useSearchParams();
  const tagsParam = sp.get("tags") ?? "";

  return (
    <li
      className="rounded border bg-white dark:bg-sidebar border-border dark:border-sidebar-border text-foreground dark:text-sidebar-foreground transition-colors"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {/* Clickable header */}
      <div
        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {it.url ? (
              <Link
                href={it.url}
                // prefetch={true} Does nothing since it's an external url
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
                    href={`/space/edit/${it.slug}`}
                    prefetch={true}
                    onClick={(e) => e.stopPropagation()}
                  >
                    edit
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/space/add?duplicate=${it.slug}`}
                    prefetch={true}
                    onClick={(e) => e.stopPropagation()}
                  >
                    duplicate
                  </Link>
                </Button>
              </>
            )}
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/space/review?tags=${tagsParam}&item=${it.slug}`}
                prefetch={true}
                onClick={(e) => e.stopPropagation()}
              >
                review
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground capitalize">{it.category}</span>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
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
                <span className="ml-2 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1 py-0.5">
                  due
                </span>
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
              <div
                className="p-3 rounded overflow-auto prose prose-sm dark:prose-invert max-w-none
                bg-white dark:bg-sidebar
                border border-border dark:border-sidebar-border"
              >
                <MarkdownContent
                  html={it.contentHtml}
                  className="prose prose-sm dark:prose-invert max-w-none"
                />
              </div>
            </div>

            {/* Code */}
            {it.code && <CodeDisplay code={it.code} codeHtml={it.codeHtml} />}
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
              <button
                className="rounded border border-border px-2 py-1 hover:bg-muted transition-colors"
                onClick={() => onReview(it.id, Rating.Again)}
              >
                Again
              </button>
              <button
                className="rounded border border-border px-2 py-1 hover:bg-muted transition-colors"
                onClick={() => onReview(it.id, Rating.Hard)}
              >
                Hard
              </button>
              <button
                className="rounded border border-border px-2 py-1 hover:bg-muted transition-colors"
                onClick={() => onReview(it.id, Rating.Good)}
              >
                Good
              </button>
              <button
                className="rounded border border-border px-2 py-1 hover:bg-muted transition-colors"
                onClick={() => onReview(it.id, Rating.Easy)}
              >
                Easy
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
