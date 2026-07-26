'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseQuery } from '@/app/lib/searchlang';
import { searchItems } from '@/app/lib/item-search';
import type { Item } from '@/app/lib/item-types';
import type { ReviewState } from '@/app/lib/review-types';
import { ResultsClient } from './space-results-client';
import { Rating } from 'ts-fsrs';
import { useNow } from '@/app/lib/hooks/useNow';
import { reviewOnce, debugCard } from '@/app/lib/fsrs-adapter';
import { useItems } from '@/app/lib/contexts/item-context';
import { createClient } from '@/utils/supabase/client';
import { SpaceHeader } from './space-header';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 20;

export function SpaceView() {
  const supabase = createClient();
  const sp = useSearchParams();
  const tagsParam = sp.get('tags') ?? undefined;

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

  const q = useMemo(() => parseQuery(tagsParam), [tagsParam]);
  const [mutations, setMutations] = useState<Record<string, ReviewState>>({});
  const [page, setPage] = useState(1);

  const [prevTagsParam, setPrevTagsParam] = useState(tagsParam);
  if (prevTagsParam !== tagsParam) {
    setPrevTagsParam(tagsParam);
    setPage(1);
  }

  const items = useMemo<Item[]>(() => {
    const withMutations = allItems.map((item) => {
      const mutation = mutations[item.id];
      return mutation ? { ...item, review: mutation } : item;
    });
    return searchItems(withMutations, q, nowMs);
  }, [allItems, mutations, q, nowMs]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, page]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const itemCount = `${items.length}${hasMore ? '+' : ''}`;
  const headerStatus = tagsParam ? `${itemCount} · ${tagsParam}` : `${itemCount} items`;
  const visibleHeaderStatus = refreshing ? `${headerStatus} · Updating` : headerStatus;

  useEffect(() => {
    if (page >= totalPages && hasMore && !loadingMore) {
      void loadMore();
    }
  }, [hasMore, loadMore, loadingMore, page, totalPages]);

  const onEnroll = useCallback(
    async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const initialReview: ReviewState = {
        state: 0,
        due: nowMs,
        last_review: null,
        stability: 0,
        difficulty: 0,
        scheduled_days: 0,
        learning_steps: 0,
        reps: 0,
        lapses: 0,
        suspended: false,
      };

      setMutations((previous) => ({ ...previous, [id]: initialReview }));

      const { error: enrollError } = await supabase.from('reviews').insert({
        item_id: id,
        user_id: user?.id || null,
        ...initialReview,
      });

      if (enrollError) {
        console.error('Failed to enroll:', enrollError);
        setMutations((previous) => {
          const { [id]: _removed, ...rest } = previous;
          return rest;
        });
      }
    },
    [nowMs, supabase],
  );

  const onReview = useCallback(
    async (id: string, rating: Rating) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const current = mutations[id] ?? allItems.find((item) => item.id === id)?.review;
      debugCard(current, 'BEFORE');
      const next = reviewOnce(current, rating, nowMs);
      debugCard(next, 'AFTER');
      setMutations((previous) => ({ ...previous, [id]: next }));

      const { error: reviewError } = await supabase.from('reviews').upsert({
        item_id: id,
        user_id: user?.id || null,
        state: next.state,
        due: next.due,
        last_review: next.last_review,
        stability: next.stability,
        difficulty: next.difficulty,
        scheduled_days: next.scheduled_days,
        learning_steps: next.learning_steps,
        reps: next.reps,
        lapses: next.lapses,
        suspended: next.suspended || false,
      });

      if (reviewError) console.error('Failed to save review:', reviewError);
    },
    [allItems, mutations, nowMs, supabase],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <SpaceHeader
        leftContent={visibleHeaderStatus}
        onEditorToggle={() => setEditorOpen(!editorOpen)}
        isEditorOpen={editorOpen}
      />
      <main
        data-space-scroll-region
        className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 md:pb-4"
      >
        {error ? (
          <div
            className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm"
            role="alert"
          >
            <span className="min-w-0">{error}</span>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => void reload()}>
              Retry
            </Button>
          </div>
        ) : null}

        <ResultsClient
          items={paginatedItems}
          onReview={onReview}
          onEnroll={onEnroll}
          nowMs={nowMs}
          isAdmin={isAdmin}
        />

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? 'Loading…' : 'Load more items'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
