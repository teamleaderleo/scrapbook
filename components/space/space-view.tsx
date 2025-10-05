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
import { useAllItems } from "@/app/lib/hooks/useAllItems";
import { supabase } from "@/app/lib/db/supabase";

export function SpaceView({ serverNow }: { serverNow: number }) {
  const nowMs = useNow(serverNow, 30000);
  const sp = useSearchParams();
  const tagsParam = sp.get("tags") ?? undefined;

  const { items: allItems, loading } = useAllItems();

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

    // Optimistic update
    setMutations(prev => ({ ...prev, [id]: initialReview }));

    // Persist to Supabase
    const { error } = await supabase.from('reviews').insert({
      item_id: id,
      ...initialReview,
    });

    if (error) {
      console.error('Failed to enroll:', error);
      // Rollback on error
      setMutations(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const onReview = useCallback(async (id: string, rating: Rating) => {
    console.group(`Review: ${id} with Rating.${Rating[rating]}`);
    
    const current = mutations[id] ?? allItems.find(x => x.id === id)?.review;
    debugCard(current, "BEFORE");
    
    const next = reviewOnce(current, rating, Date.now());
    debugCard(next, "AFTER");
    
    setMutations(prev => ({ ...prev, [id]: next }));
    
    console.groupEnd();

    const { error } = await supabase.from('reviews').upsert({
      item_id: id,
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
  }, [allItems, mutations]);

  if (loading) {
    return (
      <main className="p-4">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-2">Second Brain</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Query: {tagsParam ?? "(none)"} · {items.length} items
      </p>
      <ResultsClient items={items} onReview={onReview} onEnroll={onEnroll} nowMs={nowMs} />
    </main>
  );
}