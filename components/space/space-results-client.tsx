'use client';

import Link from 'next/link';
import { Rating } from 'ts-fsrs';
import { Button } from '@/components/ui/button';
import type { Item } from '@/app/lib/item-types';
import { formatInterval, formatDueRelative } from '@/app/lib/interval-format';
import { useMemo, useState } from 'react';
import { MarkdownContent } from './markdown-content';
import { useSearchParams } from 'next/navigation';
import { CodeDisplay } from './code-display';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSpaceShortcut } from './space-shortcut-provider';

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

  const toggleHoveredShortcut = useMemo(
    () => ({
      enabled: Boolean(hoveredId),
      disabledReason: hoveredId ? undefined : 'Hover an item first',
      run: () => {
        if (!hoveredId) return;
        setExpandedIds((previous) => ({
          ...previous,
          [hoveredId]: !previous[hoveredId],
        }));
      },
    }),
    [hoveredId],
  );
  useSpaceShortcut('list.toggle-hovered', toggleHoveredShortcut);

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const expanded = Boolean(expandedIds[item.id]);
        const onToggle = () =>
          setExpandedIds((previous) => ({ ...previous, [item.id]: !previous[item.id] }));

        return (
          <Row
            key={item.id}
            item={item}
            onReview={onReview}
            onEnroll={onEnroll}
            nowMs={nowMs}
            isAdmin={isAdmin}
            expanded={expanded}
            onToggle={onToggle}
            onHoverChange={(isHovering) =>
              setHoveredId(isHovering ? item.id : hoveredId === item.id ? null : hoveredId)
            }
          />
        );
      })}
    </ul>
  );
}

function Row({
  item,
  onReview,
  onEnroll,
  nowMs,
  isAdmin,
  expanded,
  onToggle,
  onHoverChange,
}: {
  item: Item;
  onReview: (id: string, rating: Rating) => void;
  onEnroll: (id: string) => void;
  nowMs: number;
  isAdmin: boolean;
  expanded: boolean;
  onToggle: () => void;
  onHoverChange: (hovering: boolean) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(item.defaultIndex);
  const active = item.versions[activeIdx];
  const displayTags = item.tags.map((tag) => (tag.includes(':') ? tag.split(':')[1] : tag));
  const searchParams = useSearchParams();
  const tagsParam = searchParams.get('tags') ?? '';

  return (
    <li
      className="rounded border border-border bg-white text-foreground transition-colors dark:border-sidebar-border dark:bg-sidebar dark:text-sidebar-foreground"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className="cursor-pointer p-3 transition-colors hover:bg-muted/50" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item.url ? (
              <Link
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {item.title}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.title}</span>
            )}
            {isAdmin ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/space/edit/${item.slug}`}
                  prefetch
                  onClick={(event) => event.stopPropagation()}
                >
                  edit
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/space/review?tags=${tagsParam}&item=${item.slug}`}
                prefetch
                onClick={(event) => event.stopPropagation()}
              >
                review
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs capitalize text-muted-foreground">{item.category}</span>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="mt-1 text-xs text-muted-foreground">
          tags: {displayTags.join(', ')}
          {item.review ? (
            <>
              {' · next: '}
              {formatDueRelative(nowMs, new Date(item.review.due))}
              {' · ivl: '}
              {formatInterval(nowMs, new Date(item.review.due), item.review.scheduled_days)}
              {item.review.due <= nowMs ? (
                <span className="ml-2 rounded bg-red-100 px-1 py-0.5 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  due
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-border p-3">
          {item.versions.length > 1 ? (
            <div className="mb-3 flex gap-2 text-xs">
              {item.versions.map((version, index) => (
                <button
                  key={index}
                  onMouseEnter={() => setActiveIdx(index)}
                  className={`rounded border px-2 py-1 transition-colors ${
                    index === activeIdx
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {version.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <div className="prose prose-sm max-w-none overflow-auto rounded border border-border bg-white p-3 dark:border-sidebar-border dark:bg-sidebar dark:prose-invert">
                <MarkdownContent
                  html={active.contentHtml}
                  className="prose prose-sm max-w-none dark:prose-invert"
                />
              </div>
            </div>

            {active.code ? <CodeDisplay code={active.code} codeHtml={active.codeHtml} /> : null}
          </div>
        </div>
      ) : null}

      {isAdmin ? (
        <div className="border-t border-border p-3" onClick={(event) => event.stopPropagation()}>
          {!item.review ? (
            <button
              className="rounded border border-border px-2 py-1 text-xs transition-colors hover:bg-muted"
              onClick={() => onEnroll(item.id)}
            >
              Add to reviews
            </button>
          ) : (
            <div className="flex gap-2 text-xs">
              <button
                className="rounded border border-border px-2 py-1 transition-colors hover:bg-muted"
                onClick={() => onReview(item.id, Rating.Again)}
              >
                Again
              </button>
              <button
                className="rounded border border-border px-2 py-1 transition-colors hover:bg-muted"
                onClick={() => onReview(item.id, Rating.Hard)}
              >
                Hard
              </button>
              <button
                className="rounded border border-border px-2 py-1 transition-colors hover:bg-muted"
                onClick={() => onReview(item.id, Rating.Good)}
              >
                Good
              </button>
              <button
                className="rounded border border-border px-2 py-1 transition-colors hover:bg-muted"
                onClick={() => onReview(item.id, Rating.Easy)}
              >
                Easy
              </button>
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}
