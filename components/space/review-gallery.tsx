"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { parseQuery } from "@/app/lib/searchlang";
import { searchItems } from "@/app/lib/item-search";
import { useItems } from "@/app/lib/contexts/item-context";
import { useNow } from "@/app/lib/hooks/useNow";
import { MarkdownContent } from "./markdown-content";
import { Rating } from "ts-fsrs";
import { reviewOnce } from "@/app/lib/fsrs-adapter";
import { createClient } from "@/utils/supabase/client";
import type { ReviewState } from "@/app/lib/review-types";
import { SpaceHeader } from "./space-header";
import { CodeDisplay } from "./code-display";

export function ReviewGallery() {
  const supabase = createClient();
  // Items are pre-loaded from layout!
  const { items: allItems, isAdmin, nowMs: initialNowMs } = useItems(); // Get server timestamp
  const nowMs = useNow(initialNowMs, 30_000); // Use server timestamp as base
  const sp = useSearchParams();
  const router = useRouter();
  const tagsParam = sp.get("tags") ?? undefined;
  const itemParam = sp.get("item");

  const [mutations, setMutations] = useState<Record<string, ReviewState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showContent, setShowContent] = useState(true);

  const q = useMemo(() => parseQuery(tagsParam), [tagsParam]);
  
  const items = useMemo(() => {
    const withMutations = allItems.map(it => {
      const mutation = mutations[it.id];
      return mutation ? { ...it, review: mutation } : it;
    });
    return searchItems(withMutations, q, nowMs);
  }, [allItems, mutations, q, nowMs]);

  const current = items[currentIndex];

  // Jump to the specified item on load
  useEffect(() => {
    if (itemParam && items.length > 0) {
      const index = items.findIndex(it => it.id === itemParam);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [itemParam, items]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      // Ignore if any modifier keys are pressed (Ctrl, Cmd, Alt, Shift)
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'j') {
        setCurrentIndex(i => Math.min(i + 1, items.length - 1));
        setShowContent(true);
      }
      if (e.key === 'ArrowLeft' || e.key === 'k') {
        setCurrentIndex(i => Math.max(i - 1, 0));
        setShowContent(true);
      }
      if (e.key === ' ') {
        e.preventDefault();
        setShowContent(s => !s);
      }
      if (e.key === 'Escape') {
        router.push('/space' + (tagsParam ? `?tags=${tagsParam}` : ''));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items.length, tagsParam, router]);

  const onReview = async (rating: Rating) => {
    if (!current) return;
    
    const next = reviewOnce(current.review, rating, Date.now());
    setMutations(prev => ({ ...prev, [current.id]: next }));
    
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

    // Auto-advance after review
    if (currentIndex < items.length - 1) {
      setCurrentIndex(i => i + 1);
      setShowContent(true);
    }
  };

  if (!current) {
    return (
      <>
        <SpaceHeader 
          leftContent="No items"
        />
        <div className="p-4 text-muted-foreground">No items to review</div>
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <SpaceHeader 
        leftContent={`${currentIndex + 1} / ${items.length}`}
        rightContent={
          isAdmin ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/space/edit/${current.id}`}>
                  edit
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/space/add?duplicate=${current.id}`}>
                  duplicate
                </Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Title */}
        <h1 className="text-2xl font-bold mb-4 text-foreground">{current.title}</h1>

        {/* Content */}
        {showContent && (
          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Writeup */}
            <div className="flex-1 overflow-auto rounded p-4 border border-border dark:border-sidebar-border bg-white dark:bg-sidebar">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownContent 
                  html={current.contentHtml}
                  className="prose prose-sm dark:prose-invert max-w-none"
                />
              </div>
            </div>

            {/* Code */}
            {current.code && <CodeDisplay code={current.code} codeHtml={current.codeHtml} />}
          </div>
        )}

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            ← → or j/k to navigate · Space to {showContent ? 'hide' : 'show'} content
          </div>
          
          {isAdmin && current.review && (
            <div className="flex gap-2">
              <button 
                onClick={() => onReview(Rating.Again)}
                className="px-3 py-1 rounded border border-border hover:bg-muted transition-colors"
              >
                Again (1)
              </button>
              <button 
                onClick={() => onReview(Rating.Hard)}
                className="px-3 py-1 rounded border border-border hover:bg-muted transition-colors"
              >
                Hard (2)
              </button>
              <button 
                onClick={() => onReview(Rating.Good)}
                className="px-3 py-1 rounded border border-border hover:bg-muted transition-colors"
              >
                Good (3)
              </button>
              <button 
                onClick={() => onReview(Rating.Easy)}
                className="px-3 py-1 rounded border border-border hover:bg-muted transition-colors"
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