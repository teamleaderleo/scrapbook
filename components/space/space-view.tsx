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

export function SpaceView() {
  const supabase = createClient();
  const baseNow = useMemo(() => Date.now(), []);       // stable for lifetime
  const nowMs = useNow(baseNow, 30_000);
  const sp = useSearchParams();
  const tagsParam = sp.get("tags") ?? undefined;

  // Items are pre-loaded from layout, no loading state needed!
  const { items: allItems, isAdmin } = useItems();

  const q = useMemo(() => parseQuery(tagsParam), [tagsParam]);
  
  const [mutations, setMutations] = useState<Record<string, ReviewState>>({});

  const items = useMemo<Item[]>(() => {
    const withMutations = allItems.map(it => {
      const mutation = mutations[it.id];
      return mutation ? { ...it, review: mutation } : it;
    });
    return searchItems(withMutations, q, nowMs);
  }, [allItems, mutations, q, nowMs]);

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
        leftContent={`Query: ${tagsParam ?? "(none)"} · ${items.length} items`}
      />
      <main className="p-4">
        <ResultsClient 
          items={items} 
          onReview={onReview} 
          onEnroll={onEnroll} 
          nowMs={nowMs}
          isAdmin={isAdmin}
        />
      </main>
    </div>
  );
}