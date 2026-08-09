'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useItems } from '@/app/lib/contexts/item-context';
import { SpaceHeader } from '@/components/space/space-header';
import { displaySpaceTags } from '@/lib/space-tags';
import {
  EMPTY_SPACE_TRAIL_MEMORY,
  markSpaceTrailOpened,
  parseSpaceTrailMemory,
  rankSpaceTrail,
  setSpaceTrailResume,
  updateSpaceTrailReaction,
  type SpaceTrailMemory,
  type SpaceTrailReaction,
  type SpaceTrailRecommendation,
} from '@/lib/space-trail';

const TRAIL_MEMORY_KEY = 'scrapbook:space-trail:v1';
const LOAD_MORE_THRESHOLD = 8;

function readMemory() {
  try {
    return parseSpaceTrailMemory(window.localStorage.getItem(TRAIL_MEMORY_KEY));
  } catch {
    return EMPTY_SPACE_TRAIL_MEMORY;
  }
}

function writeMemory(memory: SpaceTrailMemory) {
  try {
    window.localStorage.setItem(TRAIL_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // The current session remains personalized when storage is unavailable.
  }
}

function TrailReactionButton({
  label,
  reaction,
  activeReaction,
  onSelect,
  icon,
}: {
  label: string;
  reaction: SpaceTrailReaction;
  activeReaction?: SpaceTrailReaction;
  onSelect: (reaction: SpaceTrailReaction) => void;
  icon: React.ReactNode;
}) {
  const active = activeReaction === reaction;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(reaction)}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${
        active
          ? 'border-foreground/35 bg-foreground text-background'
          : 'border-border/75 bg-background/65 text-muted-foreground hover:border-foreground/25 hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TrailCard({
  recommendation,
  index,
  total,
  reaction,
  onReaction,
  onOpen,
}: {
  recommendation: SpaceTrailRecommendation;
  index: number;
  total: number;
  reaction?: SpaceTrailReaction;
  onReaction: (reaction: SpaceTrailReaction) => void;
  onOpen: () => void;
}) {
  const { item, estimatedMinutes, excerpt, reasons } = recommendation;
  const tags = displaySpaceTags(item.tags).slice(0, 5);
  const isStoppingPoint = (index + 1) % 12 === 0;

  return (
    <section
      className="grid min-h-full snap-start snap-always place-items-center px-3 py-4 sm:px-6 sm:py-8"
      data-trail-index={index}
      data-trail-item={item.id}
    >
      <article
        className="material-paper relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[1.6rem] border shadow-[0_22px_70px_rgba(43,37,29,0.12)] dark:shadow-[0_24px_72px_rgba(0,0,0,0.32)]"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '780px' }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-dashed border-[hsl(var(--material-paper-edge)/0.62)] px-5 py-4 sm:px-7">
          <p className="min-w-0 truncate font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--material-paper-ink)/0.55)]">
            {item.category} · {estimatedMinutes} min
          </p>
          <p className="shrink-0 font-mono text-[9px] tabular-nums text-[hsl(var(--material-paper-ink)/0.42)]">
            {String(index + 1).padStart(2, '0')} / {total}
          </p>
        </div>

        <div className="px-5 pb-5 pt-6 sm:px-7 sm:pb-7 sm:pt-8">
          <h2 className="max-w-[23ch] text-balance text-[clamp(1.75rem,7vw,3.15rem)] font-semibold leading-[1.02] tracking-[-0.042em] text-[hsl(var(--material-paper-ink))]">
            {item.title}
          </h2>

          {excerpt ? (
            <p className="mt-5 max-w-[62ch] text-[15px] leading-7 text-[hsl(var(--material-paper-ink)/0.7)] sm:text-base">
              {excerpt}
            </p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-1.5" aria-label="Topics">
              {tags.map((tag, tagIndex) => (
                <span
                  key={`${tag}-${tagIndex}`}
                  className="rounded-full border border-[hsl(var(--material-paper-edge)/0.68)] bg-[hsl(var(--material-paper-face)/0.55)] px-2.5 py-1 text-[10px] text-[hsl(var(--material-paper-ink)/0.62)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <details className="group mt-6 rounded-xl border border-[hsl(var(--material-paper-edge)/0.62)] bg-[hsl(var(--material-paper-ink)/0.025)] px-3.5 py-3 text-xs text-[hsl(var(--material-paper-ink)/0.62)]">
            <summary className="cursor-pointer list-none font-medium text-[hsl(var(--material-paper-ink)/0.72)] focus-visible:outline-none group-open:mb-2">
              Why this?
            </summary>
            <ul className="space-y-1.5 leading-5">
              {reasons.map(reason => (
                <li key={reason}>· {reason}</li>
              ))}
            </ul>
          </details>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <TrailReactionButton
              label="More"
              reaction="more"
              activeReaction={reaction}
              onSelect={onReaction}
              icon={<ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />}
            />
            <TrailReactionButton
              label="Less"
              reaction="less"
              activeReaction={reaction}
              onSelect={onReaction}
              icon={<ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />}
            />
            <TrailReactionButton
              label="Learned"
              reaction="learned"
              activeReaction={reaction}
              onSelect={onReaction}
              icon={<Check className="h-3.5 w-3.5" aria-hidden="true" />}
            />
          </div>

          <Link
            href={`/space/read/${encodeURIComponent(item.slug)}?lane=archive&from=trail`}
            prefetch
            onClick={onOpen}
            className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--material-paper-ink))] px-4 text-sm font-semibold text-[hsl(var(--material-paper-face))] transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--material-paper-ink)/0.4)] active:translate-y-0"
          >
            Open study
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          {isStoppingPoint ? (
            <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[hsl(var(--material-paper-ink)/0.45)]">
              A good place to stop · or keep swiping
            </p>
          ) : null}
        </div>
        <span className="material-paper-edge" aria-hidden="true" />
      </article>
    </section>
  );
}

export function SpaceTrail() {
  const { items, nowMs, hasMore, loadMore, loadingMore, error, reload } =
    useItems();
  const seed = `space-trail:${new Date(nowMs).toISOString().slice(0, 10)}`;
  const scrollerRef = useRef<HTMLElement>(null);
  const initializedRef = useRef(false);
  const resumedRef = useRef(false);
  const [memory, setMemory] = useState<SpaceTrailMemory>(
    EMPTY_SPACE_TRAIL_MEMORY
  );
  const [recommendations, setRecommendations] = useState(() =>
    rankSpaceTrail(items, EMPTY_SPACE_TRAIL_MEMORY, { seed, nowMs })
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const scroller = scrollerRef.current;
      const target = scroller?.querySelector<HTMLElement>(
        `[data-trail-index="${index}"]`
      );
      target?.scrollIntoView({ behavior, block: 'start' });
    },
    []
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const storedMemory = readMemory();
    setMemory(storedMemory);
    setRecommendations(rankSpaceTrail(items, storedMemory, { seed, nowMs }));
  }, [items, nowMs, seed]);

  useEffect(() => {
    if (!initializedRef.current) return;
    setRecommendations(current => {
      const knownIds = new Set(current.map(entry => entry.item.id));
      const additions = items.filter(item => !knownIds.has(item.id));
      if (additions.length === 0) return current;
      return [
        ...current,
        ...rankSpaceTrail(additions, memory, { seed, nowMs }),
      ];
    });
  }, [items, memory, nowMs, seed]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const sections =
      scroller.querySelectorAll<HTMLElement>('[data-trail-index]');
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number(
          (visible.target as HTMLElement).dataset.trailIndex ?? 0
        );
        setActiveIndex(index);
        const itemId = (visible.target as HTMLElement).dataset.trailItem;
        if (itemId) {
          setMemory(current => {
            if (!resumedRef.current && current.resumeId) return current;
            const nextMemory = setSpaceTrailResume(current, itemId);
            if (nextMemory !== current) writeMemory(nextMemory);
            return nextMemory;
          });
        }
      },
      { root: scroller, threshold: [0.6, 0.8] }
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [recommendations.length]);

  useEffect(() => {
    if (resumedRef.current || !memory.resumeId) return;
    const index = recommendations.findIndex(
      entry => entry.item.id === memory.resumeId
    );
    if (index < 0) return;
    resumedRef.current = true;
    requestAnimationFrame(() => scrollToIndex(index, 'auto'));
  }, [memory.resumeId, recommendations, scrollToIndex]);

  useEffect(() => {
    if (
      activeIndex < recommendations.length - LOAD_MORE_THRESHOLD ||
      !hasMore ||
      loadingMore
    ) {
      return;
    }
    void loadMore();
  }, [activeIndex, hasMore, loadMore, loadingMore, recommendations.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 'j') {
        event.preventDefault();
        scrollToIndex(Math.min(activeIndex + 1, recommendations.length - 1));
      }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'k') {
        event.preventDefault();
        scrollToIndex(Math.max(activeIndex - 1, 0));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, recommendations.length, scrollToIndex]);

  const chooseReaction = (itemId: string, reaction: SpaceTrailReaction) => {
    const nextReaction =
      memory.reactions[itemId] === reaction ? null : reaction;
    const nextMemory = updateSpaceTrailReaction(memory, itemId, nextReaction);
    setMemory(nextMemory);
    writeMemory(nextMemory);

    setRecommendations(current => {
      const prefix = current.slice(0, activeIndex + 1);
      const fixedIds = new Set(prefix.map(entry => entry.item.id));
      const remaining = items.filter(item => !fixedIds.has(item.id));
      return [
        ...prefix,
        ...rankSpaceTrail(remaining, nextMemory, { seed, nowMs }),
      ];
    });
  };

  const markOpened = (itemId: string) => {
    const nextMemory = markSpaceTrailOpened(memory, itemId);
    setMemory(nextMemory);
    writeMemory(nextMemory);
  };

  const resetPersonalization = () => {
    const nextMemory = EMPTY_SPACE_TRAIL_MEMORY;
    setMemory(nextMemory);
    try {
      window.localStorage.removeItem(TRAIL_MEMORY_KEY);
    } catch {
      // The in-memory reset still applies.
    }
    setRecommendations(rankSpaceTrail(items, nextMemory, { seed, nowMs }));
    setActiveIndex(0);
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const headerStatus = useMemo(() => {
    const position = recommendations.length > 0 ? activeIndex + 1 : 0;
    return `${position} / ${recommendations.length}${hasMore ? '+' : ''}${
      loadingMore ? ' · loading' : ''
    }`;
  }, [activeIndex, hasMore, loadingMore, recommendations.length]);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <SpaceHeader
        leftContent={headerStatus}
        centerContent={
          <Link
            href="/space"
            prefetch
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-transparent px-2 text-sm font-medium text-muted-foreground transition hover:border-border/60 hover:bg-muted/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Archive</span>
          </Link>
        }
        rightContent={
          <button
            type="button"
            onClick={resetPersonalization}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Reset Trail personalization"
            title="Reset Trail personalization"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        }
      />

      <main
        ref={scrollerRef}
        className="relative h-0 min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-[radial-gradient(circle_at_12%_8%,hsl(var(--muted)/0.6),transparent_32%),radial-gradient(circle_at_88%_78%,hsl(var(--muted)/0.48),transparent_28%)] [scrollbar-gutter:stable] [touch-action:pan-y]"
        aria-label="Personalized learning trail"
        data-space-trail
      >
        <h1 className="sr-only">Learning trail</h1>
        {recommendations.map((recommendation, index) => (
          <TrailCard
            key={recommendation.item.id}
            recommendation={recommendation}
            index={index}
            total={recommendations.length}
            reaction={memory.reactions[recommendation.item.id]}
            onReaction={reaction =>
              chooseReaction(recommendation.item.id, reaction)
            }
            onOpen={() => markOpened(recommendation.item.id)}
          />
        ))}

        {recommendations.length === 0 ? (
          <div className="grid min-h-full place-items-center px-4 text-center">
            <div className="max-w-sm">
              <p className="text-lg font-semibold">No studies loaded</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {error ?? 'The public archive is empty.'}
              </p>
              {error ? (
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="mt-4 min-h-[44px] rounded-xl border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Try again
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>

      <nav
        aria-label="Trail controls"
        className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-20 hidden gap-1 sm:flex"
      >
        <button
          type="button"
          onClick={() => scrollToIndex(Math.max(activeIndex - 1, 0))}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border bg-background/85 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Previous study"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() =>
            scrollToIndex(Math.min(activeIndex + 1, recommendations.length - 1))
          }
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border bg-background/85 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Next study"
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
