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

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const role = target?.getAttribute?.('role');
      const isTyping =
        tag === 'input' ||
        tag === 'textarea' ||
        target?.getAttribute('contenteditable') === 'true' ||
        role === 'textbox';

      if (isTyping || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

      if (event.key === 'ArrowRight' || event.key === 'j') {
        setCurrentIndex((index) => Math.min(index + 1, items.length - 1));
        setShowContent(true);
      }
      if (event.key === 'ArrowLeft' || event.key === 'k') {
        setCurrentIndex((index) => Math.max(index - 1, 0));
        setShowContent(true);
      }
      if (event.key === ' ') {
        event.preventDefault();
        setShowContent((visible) => !visible);
      }
      if (event.key === 'Escape') {
        router.push(`/space${tagsParam ? `?tags=${tagsParam}` : ''}`);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items.length, router, tagsParam]);

  const onReview = async (rating: Rating) => {
    if (!current) return;

    const next = reviewOnce(current.review, rating, Date.now());
    setMutations((previous) => ({ ...previous, [current.id]: next }));

    await supabase.from('reviews').upsert({
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

    if (currentIndex < items.length - 1) {
      setCurrentIndex((index) => index + 1);
      setShowContent(true);
    }
  };

  if (!current) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <SpaceHeader
          leftContent={loadingMore ? 'Loading items…' : 'No items'}
          onEditorToggle={() => setEditorOpen(!editorOpen)}
          isEditorOpen={editorOpen}
        />
        <div className="p-4 text-muted-foreground">
          {loadingMore ? 'Loading items…' : 'No items to review'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <SpaceHeader
        leftContent={`${currentIndex + 1} / ${items.length}${hasMore ? '+' : ''}`}
        onEditorToggle={() => setEditorOpen(!editorOpen)}
        isEditorOpen={editorOpen}
        rightContent={
          isAdmin ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/space/edit/${current.slug}`}>edit</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/space/add?duplicate=${current.slug}`}>duplicate</Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
        <h1 className="mb-4 text-2xl font-bold text-foreground">{current.title}</h1>

        {current.versions.length > 1 && (
          <div className="mb-4 flex gap-2 text-sm">
            {current.versions.map((version, index) => (
              <button
                key={index}
                onMouseEnter={() => setActiveIdx(index)}
                className={`rounded border px-3 py-1.5 transition-colors ${
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
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
            <div className="flex-1 overflow-auto rounded border border-border bg-white p-4 dark:border-sidebar-border dark:bg-sidebar">
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

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            ← → or j/k to navigate · Space to {showContent ? 'hide' : 'show'} content
          </div>

          {isAdmin && current.review && (
            <div className="flex gap-2">
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
