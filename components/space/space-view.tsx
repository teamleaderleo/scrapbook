"use client";
import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { parseQuery } from "@/app/lib/searchlang";
import { searchItems } from "@/app/lib/item-search";
import type { Item } from "@/app/lib/item-types";
import type { ReviewState } from "@/app/lib/review-types";
import { ResultsClient } from "./space-results-client";
import { Rating } from "ts-fsrs";
import { useNow } from "@/app/lib/hooks/useNow";
import { reviewOnce, debugCard } from "@/app/lib/fsrs-adapter";
import { useItems } from "@/app/lib/contexts/item-context";
import { createClient } from "@/utils/supabase/client";
import { SpaceHeader } from "./space-header";
import { Button } from "@/components/ui/button";
import { MonacoEditorPanel } from "./monaco-editor-panel";

const ITEMS_PER_PAGE = 20;

export function SpaceView() {
  const supabase = createClient();
  const sp = useSearchParams();
  const tagsParam = sp.get("tags") ?? undefined;

  const { items: allItems, isAdmin, nowMs: initialNowMs } = useItems();
  const nowMs = useNow(initialNowMs, 30_000);

  const q = useMemo(() => parseQuery(tagsParam), [tagsParam]);
  
  const [mutations, setMutations] = useState<Record<string, ReviewState>>({});
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);

  const items = useMemo<Item[]>(() => {
    const withMutations = allItems.map(it => {
      const mutation = mutations[it.id];
      return mutation ? { ...it, review: mutation } : it;
    });
    return searchItems(withMutations, q, nowMs);
  }, [allItems, mutations, q, nowMs]);

  // Paginate the filtered items
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, page]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useMemo(() => {
    setPage(1);
  }, [tagsParam]);

  const onEnroll = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
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

    setMutations(prev => ({ ...prev, [id]: initialReview }));

    const { error } = await supabase.from('reviews').insert({
      item_id: id,
      user_id: user?.id || null,
      ...initialReview,
    });

    if (error) {
      console.error('Failed to enroll:', error);
      setMutations(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [supabase, nowMs]);

  const onReview = useCallback(async (id: string, rating: Rating) => {
    const { data: { user } } = await supabase.auth.getUser();

    console.group(`Review: ${id} with Rating.${Rating[rating]}`);
    
    const current = mutations[id] ?? allItems.find(x => x.id === id)?.review;
    debugCard(current, "BEFORE");
    
    const next = reviewOnce(current, rating, nowMs);
    debugCard(next, "AFTER");
    
    setMutations(prev => ({ ...prev, [id]: next }));
    
    console.groupEnd();

    const { error } = await supabase.from('reviews').upsert({
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

    if (error) {
      console.error('Failed to save review:', error);
    }
  }, [allItems, mutations, supabase, nowMs]);

  return (
    <div className="min-h-screen bg-background">
      <SpaceHeader 
        leftContent={`Query: ${tagsParam ?? "(none)"} · ${items.length} items${totalPages > 1 ? ` · Page ${page}/${totalPages}` : ''}`}
        onEditorToggle={() => setEditorOpen(!editorOpen)}
        isEditorOpen={editorOpen}
      />
      <main className="p-4">
        <ResultsClient 
          items={paginatedItems}
          onReview={onReview} 
          onEnroll={onEnroll} 
          nowMs={nowMs}
          isAdmin={isAdmin}
        />
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
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
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </main>

      <MonacoEditorPanel
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}