'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { createClient } from '@/utils/supabase/client';
import { SpaceHeader } from './space-header';
import { Button } from '@/components/ui/button';
import { PaperCreature } from '@/components/paper-creature';

const ITEMS_PER_PAGE = 20;

export function SpaceView() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const tagsParam = searchParams.get('tags') ?? undefined;

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

  const [previousTagsParam, setPreviousTagsParam] = useState(tagsParam);
  if (previousTagsParam !== tagsParam) {
    setPreviousTagsParam(tagsParam);
    setPage(1);
  }

  const items = useMemo<Item[]>(() => {
    const withMutations = allItems.map((item) => {
      const mutation = mutations[item.id];
      return mutation ? { ...item, review: mutation } : item;
    });
    return searchItems(withMutations, query, nowMs);
  }, [allItems, mutations, query, nowMs]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, page]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const itemCount = `${items.length}${hasMore ? '+' : ''}`;
  const headerStatus = tagsParam ? `${itemCount} · ${tagsParam}` : `${itemCount} clippings`;
  const visibleHeaderStatus = refreshing ? `${headerStatus} · sorting` : headerStatus;

  useEffect(() => {
    if (page >= totalPages && hasMore && !loadingMore) {
      void loadMore();
    }
  }, [hasMore, loadMore, loadingMore, page, totalPages]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod || event.key.toLowerCase() !== 'i') return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const role = target?.getAttribute?.('role');
      const isTyping =
        tag === 'input' ||
        tag === 'textarea' ||
        target?.getAttribute('contenteditable') === 'true' ||
        role === 'textbox';

      if (isTyping) return;
      event.preventDefault();
      setEditorOpen(!editorOpen);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editorOpen, setEditorOpen]);

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
      const previousOverride = mutations[id];
      const current = previousOverride ?? allItems.find((item) => item.id === id)?.review;
      const next = reviewOnce(current, rating, nowMs);

      setMutationError(null);
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

      if (reviewError) {
        console.error('Failed to save review:', reviewError);
        setMutations((previous) => rollbackFailedReview(previous, id, next, previousOverride));
        setMutationError("That review wasn't saved. The previous schedule has been restored.");
      }
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
          <section className="mb-4 flex items-end justify-between gap-4 px-1">
            <div>
              <span className="material-label-stamped text-[9px] text-muted-foreground">clipping drawer</span>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Notes worth keeping</h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                Open a clipping to read it, or use Shift while hovering to unfold one quickly.
              </p>
            </div>
            <PaperCreature
              pose={refreshing ? 'sniffing' : 'reading'}
              size="md"
              className="md:hidden"
              label={refreshing ? 'Scraplet sorting the clippings' : 'Scraplet reading a clipping'}
            />
          </section>

          {error ? (
            <div
              className="material-paper relative mb-4 flex items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3 text-sm"
              role="alert"
            >
              <span className="min-w-0">{error}</span>
              <Button variant="outline" size="sm" className="shrink-0 rounded-lg" onClick={() => void reload()}>
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
              <Button variant="outline" size="sm" className="shrink-0 rounded-lg" onClick={() => setMutationError(null)}>
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
          />

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous drawer
              </Button>
              <span className="rounded-full border border-border/60 bg-background/65 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next drawer
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
                {loadingMore ? 'Opening drawer…' : 'Open more clippings'}
              </Button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
