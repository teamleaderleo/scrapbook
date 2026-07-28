'use client';

import Link from 'next/link';
import { Rating } from 'ts-fsrs';
import type { Item } from '@/app/lib/item-types';
import { formatInterval, formatDueRelative } from '@/app/lib/interval-format';
import { useEffect, useState } from 'react';
import { MarkdownContent } from './markdown-content';
import { useSearchParams } from 'next/navigation';
import { CodeDisplay } from './code-display';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PaperCreature } from '@/components/paper-creature';
import { PageCurl, PressedSprig, StitchedRule } from '@/components/cozy-flourishes';

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const role = target?.getAttribute?.('role');
      const isTyping =
        tag === 'input' ||
        tag === 'textarea' ||
        target?.getAttribute('contenteditable') === 'true' ||
        role === 'textbox';

      if (isTyping) return;

      if (event.key === 'Shift' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.repeat) {
        if (hoveredId) {
          setExpandedIds((previous) => ({ ...previous, [hoveredId]: !previous[hoveredId] }));
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hoveredId]);

  if (items.length === 0) {
    return (
      <section className="material-paper relative mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border px-6 py-10 text-center">
        <span className="material-tape-strip" data-side="top" aria-hidden="true" />
        <PressedSprig className="absolute right-5 top-5 rotate-[8deg] opacity-25" />
        <PaperCreature
          pose="carrying"
          size="lg"
          className="mx-auto"
          label="Scraplet carrying a pencil and looking for a clipping"
        />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">This drawer is empty</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 opacity-70">
          Try another label or search. Scraplet will keep looking through the paper scraps.
        </p>
        <StitchedRule className="mx-auto mt-5 max-w-44" />
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] opacity-45">drawer checked twice</p>
        <PageCurl className="opacity-65" />
      </section>
    );
  }

  return (
    <ul className="grid gap-3">
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
  const [activeIndex, setActiveIndex] = useState(item.defaultIndex);
  const active = item.versions[activeIndex];
  const displayTags = item.tags.map((tag) => (tag.includes(':') ? tag.split(':')[1] : tag));
  const searchParams = useSearchParams();
  const tagsParam = searchParams.get('tags') ?? '';
  const isDue = Boolean(item.review && item.review.due <= nowMs);

  return (
    <li
      className="material-paper group relative overflow-hidden rounded-xl border transition-[transform,box-shadow,border-color] duration-150 hover:-rotate-[0.08deg] hover:border-[hsl(var(--material-paper-edge))] hover:shadow-[0_12px_26px_rgba(45,40,32,0.13)]"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-4 h-11 w-1.5 rounded-r-full bg-[#9baa88] shadow-[inset_-1px_0_rgba(75,82,67,0.22)]"
      />
      <span
        aria-hidden="true"
        className="absolute right-5 top-0 h-2.5 w-8 -translate-y-1/2 rotate-[2deg] border border-[#9d8764]/20 bg-[#d9c795]/50 opacity-0 transition-opacity group-hover:opacity-70"
      />

      <div
        className="cursor-pointer px-4 py-3.5 pl-5 transition-colors hover:bg-white/20 dark:hover:bg-black/5"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {item.url ? (
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 text-base font-semibold tracking-[-0.015em] underline-offset-4 hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {item.title}
                </Link>
              ) : (
                <span className="min-w-0 text-base font-semibold tracking-[-0.015em]">{item.title}</span>
              )}

              {isAdmin ? (
                <Link
                  href={`/space/edit/${item.slug}`}
                  prefetch
                  onClick={(event) => event.stopPropagation()}
                  className="material-label-stamped text-[9px] text-[#76604f] transition-opacity hover:opacity-70"
                >
                  edit
                </Link>
              ) : null}

              <Link
                href={`/space/review?tags=${tagsParam}&item=${item.slug}`}
                prefetch
                onClick={(event) => event.stopPropagation()}
                className="material-label-stamped text-[9px] text-[#5f6f55] transition-opacity hover:opacity-70"
              >
                study
              </Link>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-black/10 bg-white/[0.28] px-2 py-0.5 text-[10px] leading-4 opacity-70"
                >
                  {tag}
                </span>
              ))}

              {item.review ? (
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] opacity-60">
                  next {formatDueRelative(nowMs, new Date(item.review.due))} ·{' '}
                  {formatInterval(nowMs, new Date(item.review.due), item.review.scheduled_days)}
                </span>
              ) : null}

              {isDue ? (
                <span className="material-label-stamped text-[9px] text-[#9b4f45]">due</span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <span className="material-label-stamped hidden text-[9px] text-[#675f55] sm:inline-flex">
              {item.category}
            </span>
            {expanded ? (
              <ChevronDown className="h-4 w-4 opacity-55" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-55" />
            )}
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-dashed border-[hsl(var(--material-paper-edge)/0.65)] bg-white/[0.14] p-4 dark:bg-black/5">
          <StitchedRule className="mb-3" />
          {item.versions.length > 1 ? (
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              {item.versions.map((version, index) => (
                <button
                  key={version.label}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`rounded-md border px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                    index === activeIndex
                      ? 'border-[#7d735f]/50 bg-[#d8cba9]/[0.55] text-[#4f493e]'
                      : 'border-black/10 bg-white/20 opacity-65 hover:opacity-100'
                  }`}
                  type="button"
                >
                  {version.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="min-w-0 flex-1">
              <div className="overflow-auto rounded-xl border border-black/10 bg-white/[0.38] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:bg-black/[0.08]">
                <MarkdownContent
                  html={active.contentHtml}
                  className="prose prose-sm max-w-none prose-headings:tracking-tight dark:prose-invert"
                />
              </div>
            </div>

            {active.code ? <CodeDisplay code={active.code} codeHtml={active.codeHtml} /> : null}
          </div>
        </div>
      ) : null}

      {isAdmin ? (
        <div
          className="border-t border-dashed border-[hsl(var(--material-paper-edge)/0.65)] bg-white/10 px-4 py-3 dark:bg-black/5"
          onClick={(event) => event.stopPropagation()}
        >
          {!item.review ? (
            <button
              className="rounded-lg border border-[#6e7b61]/[0.35] bg-[#b9c5a8]/[0.28] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#b9c5a8]/[0.45]"
              onClick={() => onEnroll(item.id)}
              type="button"
            >
              Put in review drawer
            </button>
          ) : (
            <div className="flex flex-wrap gap-2 text-xs">
              <ReviewButton
                label="Again"
                className="border-[#a96c6c]/[0.35] bg-[#d9aaaa]/[0.24]"
                onClick={() => onReview(item.id, Rating.Again)}
              />
              <ReviewButton
                label="Hard"
                className="border-[#aa8251]/[0.35] bg-[#ddbd86]/[0.24]"
                onClick={() => onReview(item.id, Rating.Hard)}
              />
              <ReviewButton
                label="Good"
                className="border-[#6e7b61]/[0.35] bg-[#b9c5a8]/[0.28]"
                onClick={() => onReview(item.id, Rating.Good)}
              />
              <ReviewButton
                label="Easy"
                className="border-[#756d89]/[0.35] bg-[#c8bfd5]/[0.28]"
                onClick={() => onReview(item.id, Rating.Easy)}
              />
            </div>
          )}
        </div>
      ) : null}

      <PageCurl className="h-6 w-6 opacity-55 [&>span]:h-6 [&>span]:w-6" />
      <span className="material-paper-edge" aria-hidden="true" />
    </li>
  );
}

function ReviewButton({
  label,
  className,
  onClick,
}: {
  label: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-lg border px-3 py-1.5 font-medium transition-[background-color,transform] hover:-rotate-[0.4deg] ${className}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
