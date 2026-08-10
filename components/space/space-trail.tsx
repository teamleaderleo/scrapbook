'use client';

import Link from 'next/link';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useItems } from '@/app/lib/contexts/item-context';
import { SpaceHeader } from '@/components/space/space-header';
import { useSpaceShortcut } from '@/components/space/space-shortcut-provider';
import {
  buildSpaceNextMove,
  buildSpacePracticePrompt,
} from '@/lib/space-practice';
import { displaySpaceTags } from '@/lib/space-tags';
import {
  EMPTY_SPACE_TRAIL_MEMORY,
  markSpaceTrailOpened,
  parseSpaceTrailMemory,
  rankSpaceTrail,
  setSpaceTrailExpanded,
  setSpaceTrailResume,
  updateSpaceTrailReaction,
  type SpaceTrailMemory,
  type SpaceTrailReaction,
  type SpaceTrailRecommendation,
} from '@/lib/space-trail';

const TRAIL_MEMORY_KEY = 'scrapbook:space-trail:v1';

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

function scrollWithinTrail(
  scroller: HTMLElement,
  target: HTMLElement,
  behavior: ScrollBehavior,
  block: 'center' | 'nearest'
) {
  const scrollerRect = scroller.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  let delta = 0;

  if (block === 'center') {
    delta =
      targetRect.top -
      scrollerRect.top -
      (scroller.clientHeight - targetRect.height) / 2;
  } else if (targetRect.top < scrollerRect.top + 12) {
    delta = targetRect.top - scrollerRect.top - 12;
  } else if (targetRect.bottom > scrollerRect.bottom - 12) {
    delta = targetRect.bottom - scrollerRect.bottom + 12;
  }

  if (Math.abs(delta) < 1) return;
  scroller.scrollTo({
    top: Math.max(
      0,
      Math.min(scroller.scrollTop + delta, scroller.scrollHeight)
    ),
    behavior,
  });
}

function readingHref(
  recommendation: SpaceTrailRecommendation,
  reaction?: SpaceTrailReaction
) {
  const nextMove = buildSpaceNextMove(recommendation.item, {
    familiar: reaction !== undefined,
    learned: reaction === 'learned',
  });
  const params = new URLSearchParams({
    lane: 'archive',
    from: 'trail',
    return: recommendation.item.id,
    practice: nextMove.mode,
  });
  if (reaction === 'learned') params.set('stage', 'learned');
  else if (reaction) params.set('stage', 'familiar');

  return {
    href: `/space/read/${encodeURIComponent(recommendation.item.slug)}?${params.toString()}`,
    nextMove,
  };
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
      className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${
        active
          ? 'border-foreground/35 bg-foreground text-background'
          : 'border-border/70 bg-background/65 text-muted-foreground hover:border-foreground/25 hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TrailLoading({ count = 5 }: { count?: number }) {
  return (
    <div aria-label="Loading notes" className="divide-y divide-border/55">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="grid min-h-36 animate-pulse grid-cols-[2.25rem_minmax(0,1fr)] gap-3 px-2 py-4 motion-reduce:animate-none sm:grid-cols-[3rem_minmax(0,1fr)_7rem] sm:gap-4 sm:px-4"
        >
          <div className="mt-1 h-3 w-6 rounded bg-muted" />
          <div className="min-w-0">
            <div className="h-2.5 w-24 rounded bg-muted" />
            <div className="mt-3 h-5 w-4/5 rounded bg-muted" />
            <div className="mt-3 h-3 w-full rounded bg-muted/80" />
            <div className="mt-2 h-3 w-3/5 rounded bg-muted/65" />
          </div>
          <div className="hidden sm:block">
            <div className="h-9 rounded-lg bg-muted/75" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrailCard({
  recommendation,
  index,
  reaction,
  expanded,
  copyState,
  onReaction,
  onToggle,
  onCopy,
  onOpen,
}: {
  recommendation: SpaceTrailRecommendation;
  index: number;
  reaction?: SpaceTrailReaction;
  expanded: boolean;
  copyState?: 'copied' | 'failed';
  onReaction: (reaction: SpaceTrailReaction) => void;
  onToggle: () => void;
  onCopy: () => void;
  onOpen: () => void;
}) {
  const { item, estimatedMinutes, excerpt, reasons } = recommendation;
  const tags = displaySpaceTags(item.tags).slice(0, 4);
  const { href, nextMove } = readingHref(recommendation, reaction);
  const titleId = `trail-title-${item.id}`;
  const detailId = `trail-detail-${item.id}`;

  return (
    <article
      id={`trail-${item.id}`}
      aria-labelledby={titleId}
      className="group relative scroll-mt-16 px-2 py-4 sm:px-4 sm:py-5"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '160px' }}
      data-trail-index={index}
      data-trail-item={item.id}
    >
      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[3rem_minmax(0,1fr)_7rem] sm:gap-4">
        <div className="pt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground/65">
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span>{item.category}</span>
            <span aria-hidden="true">·</span>
            <span>{estimatedMinutes} min</span>
            {reaction ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{reaction}</span>
              </>
            ) : null}
          </div>

          <Link
            id={titleId}
            href={href}
            prefetch
            onClick={onOpen}
            className="mt-1.5 block max-w-[48rem] text-pretty text-lg font-semibold leading-6 tracking-[-0.02em] text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xl sm:leading-7"
          >
            {item.title}
          </Link>

          {excerpt ? (
            <p
              className={`${
                expanded ? '' : 'line-clamp-2'
              } mt-2 max-w-[72ch] text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6`}
            >
              {excerpt}
            </p>
          ) : null}

          <div className="mt-3 flex min-h-7 flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-muted/70 px-2 py-1 text-[10px] font-medium text-muted-foreground">
              {nextMove.label}
            </span>
            {tags.map((tag, tagIndex) => (
              <span
                key={`${tag}-${tagIndex}`}
                className="rounded-md border border-border/55 px-2 py-1 text-[10px] text-muted-foreground/85"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="col-start-2 flex items-start gap-2 sm:col-start-3 sm:row-start-1 sm:justify-end">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={onToggle}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-background/65 px-3 text-xs font-medium text-muted-foreground transition hover:border-foreground/25 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
          >
            {expanded ? 'Close' : 'Peek'}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {expanded ? (
        <div
          id={detailId}
          className="ml-[3rem] mt-4 border-l border-border/65 pl-3 sm:ml-[4rem] sm:pl-5"
          data-trail-detail
        >
          <div className="max-w-[72ch] rounded-xl border border-border/60 bg-muted/25 px-4 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>Try before opening</span>
              <span>{nextMove.mode}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground/85">
              {nextMove.prompt}
            </p>
          </div>

          <div className="mt-3 max-w-[72ch]">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Why it is here
            </p>
            <ul className="mt-1.5 space-y-1 text-xs leading-5 text-muted-foreground">
              {reasons.map(reason => (
                <li key={reason}>· {reason}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 grid max-w-md grid-cols-3 gap-2">
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

          <div className="mt-3 flex max-w-md flex-col gap-2 min-[420px]:flex-row">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-border/70 bg-background/65 px-3 text-xs font-medium text-muted-foreground transition hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copyState === 'copied' ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copyState === 'copied' ? 'Copied for chat' : 'Copy for chat'}
            </button>
            <Link
              href={href}
              prefetch
              onClick={onOpen}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-foreground px-3 text-xs font-semibold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Read the note
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <p
            className="mt-2 min-h-4 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/75"
            aria-live="polite"
          >
            {copyState === 'failed'
              ? 'Clipboard unavailable · open the note and copy from there'
              : copyState === 'copied'
                ? 'Prompt and links copied'
                : 'Includes the prompt, Scrapbook link, and pinned source'}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function SpaceTrail() {
  const {
    items,
    nowMs,
    loading,
    hasMore,
    loadMore,
    loadingMore,
    error,
    reload,
  } = useItems();
  const seed = `space-trail:${new Date(nowMs).toISOString().slice(0, 10)}`;
  const scrollerRef = useRef<HTMLElement>(null);
  const loadSentinelRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const resumedRef = useRef(false);
  const [memory, setMemory] = useState<SpaceTrailMemory>(
    EMPTY_SPACE_TRAIL_MEMORY
  );
  const [memoryReady, setMemoryReady] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [copyState, setCopyState] = useState<{
    itemId: string;
    status: 'copied' | 'failed';
  } | null>(null);
  const [recommendations, setRecommendations] = useState(() =>
    rankSpaceTrail(items, EMPTY_SPACE_TRAIL_MEMORY, { seed, nowMs })
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleRecommendations = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return recommendations
      .map((recommendation, index) => ({ recommendation, index }))
      .filter(({ recommendation }) => {
        if (!normalizedQuery) return true;
        const searchable = [
          recommendation.item.title,
          recommendation.item.category,
          recommendation.excerpt,
          ...displaySpaceTags(recommendation.item.tags),
        ]
          .join(' ')
          .toLowerCase();
        return searchable.includes(normalizedQuery);
      });
  }, [deferredQuery, recommendations]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const scroller = scrollerRef.current;
      const target = scroller?.querySelector<HTMLElement>(
        `[data-trail-index="${index}"]`
      );
      if (scroller && target) {
        scrollWithinTrail(scroller, target, behavior, 'center');
      }
    },
    []
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const storedMemory = readMemory();
    setMemory(storedMemory);
    setRecommendations(rankSpaceTrail(items, storedMemory, { seed, nowMs }));
    setMemoryReady(true);
  }, [items, nowMs, seed]);

  useEffect(() => {
    if (!memoryReady) return;
    writeMemory(memory);
  }, [memory, memoryReady]);

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
        if (itemId && resumedRef.current) {
          setMemory(current => setSpaceTrailResume(current, itemId));
        }
      },
      { root: scroller, threshold: [0.25, 0.55] }
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [visibleRecommendations]);

  useEffect(() => {
    if (!memoryReady || resumedRef.current) return;
    const hash = window.location.hash.slice(1);
    const hashItemId = hash.startsWith('trail-')
      ? decodeURIComponent(hash.slice('trail-'.length))
      : undefined;
    const requestedId = hashItemId || memory.resumeId;
    if (!requestedId) {
      resumedRef.current = true;
      return;
    }

    const index = recommendations.findIndex(
      entry => entry.item.id === requestedId
    );
    if (index < 0) {
      if (hasMore && !loadingMore) void loadMore();
      else if (!hasMore) resumedRef.current = true;
      return;
    }

    resumedRef.current = true;
    requestAnimationFrame(() => scrollToIndex(index, 'auto'));
  }, [
    hasMore,
    loadMore,
    loadingMore,
    memory.resumeId,
    memoryReady,
    recommendations,
    scrollToIndex,
  ]);

  useEffect(() => {
    const sentinel = loadSentinelRef.current;
    const scroller = scrollerRef.current;
    if (!sentinel || !scroller || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) void loadMore();
      },
      { root: scroller, rootMargin: '500px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadingMore, visibleRecommendations.length]);

  const nextShortcut = useMemo(
    () => ({
      enabled:
        recommendations.length > 0 && activeIndex < recommendations.length - 1,
      disabledReason:
        recommendations.length === 0
          ? 'No Trail recommendation is available'
          : 'Already at the last Trail recommendation',
      run: () =>
        scrollToIndex(Math.min(activeIndex + 1, recommendations.length - 1)),
    }),
    [activeIndex, recommendations.length, scrollToIndex]
  );
  const previousShortcut = useMemo(
    () => ({
      enabled: recommendations.length > 0 && activeIndex > 0,
      disabledReason:
        recommendations.length === 0
          ? 'No Trail recommendation is available'
          : 'Already at the first Trail recommendation',
      run: () => scrollToIndex(Math.max(activeIndex - 1, 0)),
    }),
    [activeIndex, recommendations.length, scrollToIndex]
  );
  useSpaceShortcut('trail.next', nextShortcut);
  useSpaceShortcut('trail.previous', previousShortcut);

  const chooseReaction = (itemId: string, reaction: SpaceTrailReaction) => {
    const nextReaction =
      memory.reactions[itemId] === reaction ? null : reaction;
    const nextMemory = updateSpaceTrailReaction(memory, itemId, nextReaction);
    setMemory(nextMemory);

    setRecommendations(current => {
      const selectedIndex = Math.max(
        0,
        current.findIndex(entry => entry.item.id === itemId)
      );
      const prefix = current.slice(0, selectedIndex + 1);
      const fixedIds = new Set(prefix.map(entry => entry.item.id));
      const remaining = items.filter(item => !fixedIds.has(item.id));
      return [
        ...prefix,
        ...rankSpaceTrail(remaining, nextMemory, { seed, nowMs }),
      ];
    });
  };

  const toggleExpanded = (itemId: string) => {
    setCopyState(null);
    setMemory(current => {
      const nextExpandedId = current.expandedId === itemId ? null : itemId;
      const nextMemory = setSpaceTrailExpanded(current, nextExpandedId);
      writeMemory(nextMemory);
      if (nextExpandedId) {
        requestAnimationFrame(() => {
          const scroller = scrollerRef.current;
          const target = document.getElementById(`trail-${itemId}`);
          if (scroller && target) {
            scrollWithinTrail(scroller, target, 'smooth', 'nearest');
          }
        });
      }
      return nextMemory;
    });
  };

  const markOpened = (itemId: string) => {
    setMemory(current => {
      const nextMemory = markSpaceTrailOpened(current, itemId);
      writeMemory(nextMemory);
      return nextMemory;
    });
  };

  const copyForChat = async (
    recommendation: SpaceTrailRecommendation,
    reaction?: SpaceTrailReaction
  ) => {
    const { href, nextMove } = readingHref(recommendation, reaction);
    try {
      await navigator.clipboard.writeText(
        buildSpacePracticePrompt({
          mode: nextMove.mode,
          title: recommendation.item.title,
          sourceUrl: recommendation.item.url,
          studyUrl: new URL(href, window.location.origin).toString(),
          draft: '',
          prompt: nextMove.prompt,
        })
      );
      setCopyState({ itemId: recommendation.item.id, status: 'copied' });
    } catch {
      setCopyState({ itemId: recommendation.item.id, status: 'failed' });
    }
  };

  const resetPersonalization = () => {
    const nextMemory = EMPTY_SPACE_TRAIL_MEMORY;
    resumedRef.current = true;
    setMemory(nextMemory);
    setCopyState(null);
    try {
      window.localStorage.removeItem(TRAIL_MEMORY_KEY);
    } catch {
      // The in-memory reset still applies.
    }
    setRecommendations(rankSpaceTrail(items, nextMemory, { seed, nowMs }));
    setActiveIndex(0);
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleCount = visibleRecommendations.length;
  const loadedCount = recommendations.length;
  const count = query.trim() ? `${visibleCount} / ${loadedCount}` : loadedCount;
  const headerStatus = `${count} notes${hasMore ? '+' : ''}${
    loadingMore ? ' · loading' : ''
  }`;

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
        className="relative h-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-background [scrollbar-gutter:stable] [touch-action:pan-y]"
        aria-label="Personalized learning trail"
        data-space-trail
      >
        <h1 className="sr-only">Learning trail</h1>
        <div className="mx-auto w-full max-w-5xl px-3 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="sticky top-0 z-10 -mx-3 border-b border-border/60 bg-background/90 px-3 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
            <label className="relative mx-auto block max-w-5xl">
              <span className="sr-only">Filter loaded notes</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Filter loaded notes"
                className="h-11 w-full rounded-xl border border-border/70 bg-background pl-9 pr-20 text-sm outline-none transition placeholder:text-muted-foreground/75 focus:border-foreground/25 focus:ring-2 focus:ring-ring"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] tabular-nums text-muted-foreground">
                {visibleRecommendations.length}
              </span>
            </label>
          </div>

          {error ? (
            <div
              role="alert"
              className="my-3 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/25 px-4 py-3 text-sm"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void reload()}
                className="min-h-[44px] shrink-0 rounded-lg border border-border/70 bg-background px-3 text-xs font-medium hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Try again
              </button>
            </div>
          ) : null}

          <div className="border-y border-border/60" data-space-trail-list>
            {loading && recommendations.length === 0 ? (
              <TrailLoading />
            ) : (
              visibleRecommendations.map(({ recommendation, index }) => (
                <div
                  key={recommendation.item.id}
                  className="border-b border-border/55 last:border-b-0"
                >
                  <TrailCard
                    recommendation={recommendation}
                    index={index}
                    reaction={memory.reactions[recommendation.item.id]}
                    expanded={memory.expandedId === recommendation.item.id}
                    copyState={
                      copyState?.itemId === recommendation.item.id
                        ? copyState.status
                        : undefined
                    }
                    onReaction={reaction =>
                      chooseReaction(recommendation.item.id, reaction)
                    }
                    onToggle={() => toggleExpanded(recommendation.item.id)}
                    onCopy={() =>
                      void copyForChat(
                        recommendation,
                        memory.reactions[recommendation.item.id]
                      )
                    }
                    onOpen={() => markOpened(recommendation.item.id)}
                  />
                </div>
              ))
            )}

            {loadingMore ? <TrailLoading count={2} /> : null}
          </div>

          {!loading && visibleRecommendations.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <p className="text-sm font-medium">No matching notes loaded</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {hasMore
                  ? 'The remaining archive is still being checked.'
                  : 'Try a title, topic, category, or phrase from the note.'}
              </p>
            </div>
          ) : null}

          <div ref={loadSentinelRef} className="h-px" aria-hidden="true" />

          {!hasMore && recommendations.length > 0 ? (
            <p className="py-6 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">
              End of the loaded archive
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
