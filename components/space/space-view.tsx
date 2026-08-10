'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { parseQuery } from '@/app/lib/searchlang';
import { searchItems } from '@/app/lib/item-search';
import type { Item } from '@/app/lib/item-types';
import type { ReviewState } from '@/app/lib/review-types';
import { rollbackFailedReview } from '@/app/lib/review-overrides';
import { ResultsClient } from './space-results-client';
import { Rating } from 'ts-fsrs';
import { useNow } from '@/app/lib/hooks/useNow';
import { reviewOnce } from '@/app/lib/fsrs-adapter';
import { useItems } from '@/app/lib/contexts/item-context';
import {
  enrollItemForReviewAction,
  reviewItemAction,
} from '@/app/space/actions';
import { SpaceHeader } from './space-header';
import { Button } from '@/components/ui/button';
import {
  countItemsBySpaceLane,
  filterItemsBySpaceLane,
  resolveSpaceLane,
  SPACE_LANES,
} from '@/lib/space-lanes';

const ITEMS_PER_PAGE = 20;

export function SpaceView() {
  const searchParams = useSearchParams();
  const tagsParam = searchParams.get('tags') ?? undefined;
  const laneParam = searchParams.get('lane');
  const activeLane = resolveSpaceLane(laneParam, {
    hasQuery: Boolean(tagsParam),
  });

  const {
    items: allItems,
    isAdmin,
    nowMs: initialNowMs,
    editorOpen,
    setEditorOpen,
    hasMore,
    loadMore,
    loadingMore,
    refreshing,
    error,
    reload,
  } = useItems();
  const nowMs = useNow(initialNowMs, 30_000);

  const query = useMemo(() => parseQuery(tagsParam), [tagsParam]);
  const [mutations, setMutations] = useState<Record<string, ReviewState>>({});
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const viewKey = `${activeLane}:${tagsParam ?? ''}`;
  const [previousViewKey, setPreviousViewKey] = useState(viewKey);
  if (previousViewKey !== viewKey) {
    setPreviousViewKey(viewKey);
    setPage(1);
  }

  const itemsWithMutations = useMemo<Item[]>(() => {
    return allItems.map(item => {
      const mutation = mutations[item.id];
      return mutation ? { ...item, review: mutation } : item;
    });
  }, [allItems, mutations]);

  const laneCounts = useMemo(
    () => countItemsBySpaceLane(itemsWithMutations),
    [itemsWithMutations]
  );

  const items = useMemo<Item[]>(() => {
    const laneItems = filterItemsBySpaceLane(itemsWithMutations, activeLane);
    return searchItems(laneItems, query, nowMs);
  }, [activeLane, itemsWithMutations, query, nowMs]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, page]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const itemCount = `${items.length}${hasMore ? '+' : ''}`;
  const headerStatus = tagsParam
    ? `${itemCount} · ${tagsParam}`
    : `${itemCount} · ${activeLane}`;
  const visibleHeaderStatus = refreshing
    ? `${headerStatus} · updating`
    : headerStatus;
  const activeLaneDefinition =
    SPACE_LANES.find(lane => lane.id === activeLane) ?? SPACE_LANES[0];

  useEffect(() => {
    if (
      items.length >= ITEMS_PER_PAGE &&
      page >= totalPages &&
      hasMore &&
      !loadingMore
    ) {
      void loadMore();
    }
  }, [hasMore, items.length, loadMore, loadingMore, page, totalPages]);

  const onEnroll = useCallback(async (id: string) => {
    const initialReview: ReviewState = {
      state: 0,
      due: Date.now(),
      last_review: null,
      stability: 0,
      difficulty: 0,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 0,
      suspended: false,
    };

    setMutationError(null);
    setMutations(previous => ({ ...previous, [id]: initialReview }));

    try {
      const savedReview = await enrollItemForReviewAction(id);
      setMutations(previous => ({ ...previous, [id]: savedReview }));
    } catch (enrollError) {
      console.error('Failed to enroll:', enrollError);
      setMutations(previous => {
        const { [id]: _removed, ...rest } = previous;
        return rest;
      });
      setMutationError("That clipping wasn't added to the review drawer.");
    }
  }, []);

  const onReview = useCallback(
    async (id: string, rating: Rating) => {
      const previousOverride = mutations[id];
      const current =
        previousOverride ?? allItems.find(item => item.id === id)?.review;
      const next = reviewOnce(current, rating, nowMs);

      setMutationError(null);
      setMutations(previous => ({ ...previous, [id]: next }));

      try {
        const savedReview = await reviewItemAction(id, rating);
        setMutations(previous => ({ ...previous, [id]: savedReview }));
      } catch (reviewError) {
        console.error('Failed to save review:', reviewError);
        setMutations(previous =>
          rollbackFailedReview(previous, id, next, previousOverride)
        );
        setMutationError(
          "That review wasn't saved. The previous schedule has been restored."
        );
      }
    },
    [allItems, mutations, nowMs]
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <SpaceHeader
        leftContent={visibleHeaderStatus}
        onEditorToggle={() => setEditorOpen(!editorOpen)}
        isEditorOpen={editorOpen}
      />
      <main className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(67,58,46,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(67,58,46,0.035) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto w-full max-w-5xl">
          <section className="mb-4 px-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
                Space
              </h1>
              <Link
                href="/space/trail"
                prefetch
                className="inline-flex min-h-[44px] items-center rounded-xl border border-border/70 bg-background/70 px-3 text-xs font-medium text-muted-foreground transition hover:border-foreground/25 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open reading trail
              </Link>
            </div>
          </section>

          <nav
            aria-label="Space sections"
            className="-mx-3 mb-5 grid snap-x snap-mandatory grid-flow-col auto-cols-[min(76vw,15rem)] gap-2 overflow-x-auto px-3 pb-2 sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4"
            data-space-lanes
          >
            {SPACE_LANES.map(lane => {
              const active = lane.id === activeLane;
              return (
                <Link
                  key={lane.id}
                  href={`/space?lane=${lane.id}`}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  data-space-lane={lane.id}
                  className={`group min-h-28 snap-start rounded-xl border p-3 transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'border-foreground/35 bg-card shadow-[0_8px_20px_rgb(45_39_30/0.08)] dark:shadow-[0_8px_20px_rgb(0_0_0/0.24)]'
                      : 'border-border/65 bg-background/60 hover:border-foreground/25 hover:bg-card/75'
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold tracking-tight">
                      {lane.label}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {laneCounts[lane.id]}
                      {hasMore ? '+' : ''}
                    </span>
                  </span>
                  <span className="mt-3 block text-xs leading-5 text-muted-foreground">
                    {lane.description}
                  </span>
                </Link>
              );
            })}
          </nav>

          {error ? (
            <div
              className="material-paper relative mb-4 flex items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3 text-sm"
              role="alert"
            >
              <span className="min-w-0">{error}</span>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-lg"
                onClick={() => void reload()}
              >
                Try again
              </Button>
            </div>
          ) : null}

          {mutationError ? (
            <div
              className="material-paper relative mb-4 flex items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3 text-sm"
              role="alert"
            >
              <span className="min-w-0">{mutationError}</span>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-lg"
                onClick={() => setMutationError(null)}
              >
                Dismiss
              </Button>
            </div>
          ) : null}

          <ResultsClient
            items={paginatedItems}
            onReview={onReview}
            onEnroll={onEnroll}
            nowMs={nowMs}
            isAdmin={isAdmin}
            lane={activeLane}
            emptyTitle={
              loadingMore
                ? `Loading ${activeLaneDefinition.label}…`
                : hasMore
                  ? `No ${activeLaneDefinition.label} items loaded`
                  : `No ${activeLaneDefinition.label} items`
            }
            emptyDescription={
              loadingMore
                ? 'Checking the remaining archive.'
                : hasMore
                  ? 'Load more to check the remaining archive.'
                  : activeLane === 'fieldwork'
                    ? 'Items tagged source:fieldwork or source:linux-fieldwork will appear here.'
                    : tagsParam
                      ? 'No published items match this filter.'
                      : 'No published items are assigned to this section.'
            }
          />

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page === 1}
                onClick={() => setPage(current => current - 1)}
              >
                Previous
              </Button>
              <span className="rounded-full border border-border/60 bg-background/65 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page >= totalPages}
                onClick={() => setPage(current => current + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}

          {hasMore ? (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
