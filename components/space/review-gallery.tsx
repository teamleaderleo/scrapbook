'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { parseQuery } from '@/app/lib/searchlang';
import { searchItems } from '@/app/lib/item-search';
import { useItems } from '@/app/lib/contexts/item-context';
import { useNow } from '@/app/lib/hooks/useNow';
import { MarkdownContent } from './markdown-content';
import { Rating } from 'ts-fsrs';
import { reviewOnce } from '@/app/lib/fsrs-adapter';
import { createClient } from '@/utils/supabase/client';
import type { ReviewState } from '@/app/lib/review-types';
import { SpaceHeader } from './space-header';
import { CodeDisplay } from './code-display';
import { useSpaceShortcut } from './space-shortcut-provider';
import { startNavigationFeedback } from '@/components/navigation-feedback';

export function ReviewGallery() {
  const supabase = createClient();
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
  const sp = useSearchParams();
  const router = useRouter();
  const tagsParam = sp.get('tags') ?? undefined;
  const itemParam = sp.get('item');

  const [mutations, setMutations] = useState<Record<string, ReviewState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  const q = useMemo(() => parseQuery(tagsParam), [tagsParam]);

  const items = useMemo(() => {
    const withMutations = allItems.map((item) => {
      const mutation = mutations[item.id];
      return mutation ? { ...item, review: mutation } : item;
    });
    return searchItems(withMutations, q, nowMs);
  }, [allItems, mutations, q, nowMs]);

  const current = items[currentIndex];
  const active = current?.versions[activeIdx];
  const exitHref = `/space${tagsParam ? `?tags=${encodeURIComponent(tagsParam)}` : ''}`;

  useEffect(() => {
    if (hasMore && !loadingMore) void loadMore();
  }, [hasMore, loadMore, loadingMore]);

  useEffect(() => {
    if (current) setActiveIdx(current.defaultIndex);
  }, [current, currentIndex]);

  useEffect(() => {
    if (itemParam && items.length > 0) {
      const index = items.findIndex((item) => item.id === itemParam);
      if (index !== -1) setCurrentIndex(index);
    }
  }, [itemParam, items]);

  const nextShortcut = useMemo(
    () => ({
      enabled: Boolean(current) && currentIndex < items.length - 1,
      disabledReason: current ? 'Already at the last review item' : 'No review item is available',
      run: () => {
        setCurrentIndex((index) => Math.min(index + 1, items.length - 1));
        setShowContent(true);
      },
    }),
    [current, currentIndex, items.length],
  );
  const previousShortcut = useMemo(
    () => ({
      enabled: Boolean(current) && currentIndex > 0,
      disabledReason: current ? 'Already at the first review item' : 'No review item is available',
      run: () => {
        setCurrentIndex((index) => Math.max(index - 1, 0));
        setShowContent(true);
      },
    }),
    [current, currentIndex],
  );
  const toggleContentShortcut = useMemo(
    () => ({
      enabled: Boolean(current),
      disabledReason: current ? undefined : 'No review item is available',
      run: () => setShowContent((visible) => !visible),
    }),
    [current],
  );
  const exitShortcut = useMemo(
    () => ({
      run: () => {
        startNavigationFeedback(exitHref, 'item list');
        router.push(exitHref);
      },
    }),
    [exitHref, router],
  );

  useSpaceShortcut('review.next', nextShortcut);
  useSpaceShortcut('review.previous', previousShortcut);
  useSpaceShortcut('review.toggle-content', toggleContentShortcut);
  useSpaceShortcut('review.exit', exitShortcut);

  const onReview = async (rating: Rating) => {
    if (!current) return;

    const next = reviewOnce(current.review, rating, Date.now());
    setMutations((previous) => ({ ...previous, [current.id]: next }));

    const { error: reviewError } = await supabase.from('reviews').upsert({
      item_id: current.id,
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
      return;
    }

    if (currentIndex < items.length - 1) {
      setCurrentIndex((index) => index + 1);
      setShowContent(true);
    }
  };

  if (!current) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <SpaceHeader
          leftContent={refreshing || loadingMore ? 'Updating items…' : 'No items'}
          onEditorToggle={() => setEditorOpen(!editorOpen)}
          isEditorOpen={editorOpen}
        />
        <div className="p-4 text-muted-foreground">
          {error ? (
            <div
              className="flex max-w-xl items-center justify-between gap-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-foreground"
              role="alert"
            >
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Retry
              </Button>
            </div>
          ) : refreshing || loadingMore ? (
            'Updating items…'
          ) : (
            'No items to review'
          )}
        </div>
      </div>
    );
  }

  const progress = `${currentIndex + 1} / ${items.length}${hasMore ? '+' : ''}${refreshing ? ' · Updating' : ''}`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <SpaceHeader
        leftContent={progress}
        onEditorToggle={() => setEditorOpen(!editorOpen)}
        isEditorOpen={editorOpen}
        rightContent={
          isAdmin ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/space/edit/${current.slug}`} prefetch>
                  edit
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/space/add?duplicate=${current.slug}`} prefetch>
                  duplicate
                </Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-6">
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

        <h1 className="mb-4 text-2xl font-bold text-foreground">{current.title}</h1>

        {current.versions.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            {current.versions.map((version, index) => (
              <button
                key={index}
                type="button"
                onMouseEnter={() => setActiveIdx(index)}
                onFocus={() => setActiveIdx(index)}
                onClick={() => setActiveIdx(index)}
                className={`rounded border px-3 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  index === activeIdx
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {version.label}
              </button>
            ))}
          </div>
        )}

        {showContent && active && (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto lg:flex-row lg:overflow-hidden">
            <div className="min-h-48 min-w-0 flex-1 overflow-auto rounded border border-border bg-white p-4 dark:border-sidebar-border dark:bg-sidebar">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownContent
                  html={active.contentHtml}
                  className="prose prose-sm max-w-none dark:prose-invert"
                />
              </div>
            </div>
            {active.code && <CodeDisplay code={active.code} codeHtml={active.codeHtml} />}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            ← → or j/k to navigate · Space to {showContent ? 'hide' : 'show'} content
          </div>

          {isAdmin && current.review && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void onReview(Rating.Again)}
                className="rounded border border-border px-3 py-1 transition-colors hover:bg-muted"
              >
                Again (1)
              </button>
              <button
                onClick={() => void onReview(Rating.Hard)}
                className="rounded border border-border px-3 py-1 transition-colors hover:bg-muted"
              >
                Hard (2)
              </button>
              <button
                onClick={() => void onReview(Rating.Good)}
                className="rounded border border-border px-3 py-1 transition-colors hover:bg-muted"
              >
                Good (3)
              </button>
              <button
                onClick={() => void onReview(Rating.Easy)}
                className="rounded border border-border px-3 py-1 transition-colors hover:bg-muted"
              >
                Easy (4)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
