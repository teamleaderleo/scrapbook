"use client";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { parseQuery } from "@/app/lib/searchlang";
import { searchLeetcode } from "@/app/lib/leetcode-search";
import type { LCItem } from "@/app/lib/leetcode-data";
import type { ReviewState } from "@/app/lib/review-types";
import { ResultsClient } from "./space-results-client";
import { Rating, State } from "ts-fsrs";
import { useNow } from "@/app/lib/hooks/useNow";
import { reviewOnce, debugCard } from "@/app/lib/fsrs-adapter";

export function SpaceView({
  serverNow,
  seeded,
}: { serverNow: number; seeded: LCItem[] }) {
  if (!Number.isFinite(serverNow)) {
    throw new Error(`serverNow not finite: ${serverNow}`);
  }

  const nowMs = useNow(serverNow, 30000);
  const sp = useSearchParams();
  const tagsParam = sp.get("tags") ?? undefined;

  const q = useMemo(() => parseQuery(tagsParam), [tagsParam]);
  const base = useMemo(
    () => searchLeetcode(seeded, q, serverNow),
    [seeded, q, serverNow]
  );

  const [mutations, setMutations] = useState<Record<string, ReviewState>>({});
  
  // not sure if needed but Fix for React StrictMode double-firing
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const items = useMemo<LCItem[]>(
    () =>
      base.map((it) => {
        const mutation = mutations[it.id];
        return mutation ? { ...it, review: mutation } : it;
      }),
    [base, mutations]
  );

  const onReview = useCallback((id: string, rating: Rating) => {
    // Only process if mounted (prevents double-fire in StrictMode)
    if (!isMountedRef.current) return;
    
    console.group(`Review: ${id} with Rating.${Rating[rating]}`);
    
    setMutations(prev => {
      const current = prev[id] ?? base.find(x => x.id === id)?.review;
      
      debugCard(current, "BEFORE");
      
      const next = reviewOnce(current, rating, Date.now());
      
      debugCard(next, "AFTER");
      
      if (current && next) {
        const stateNames = ["New", "Learning", "Review", "Relearning"];
        if (current.state !== next.state) {
          console.log(`📍 State transition: ${stateNames[current.state]} → ${stateNames[next.state]}`);
        }
        
        // Log interval changes
        const oldInterval = current.scheduled_days || 0;
        const newInterval = next.scheduled_days || 0;
        if (oldInterval !== newInterval) {
          console.log(`⏰ Interval: ${oldInterval}d → ${newInterval}d`);
        }
        
        // Log stability changes
        if (current.stability !== next.stability) {
          console.log(`📊 Stability: ${current.stability?.toFixed(2)} → ${next.stability?.toFixed(2)}`);
        }
      }
      
      console.groupEnd();
      
      return { ...prev, [id]: next };
    });
  }, [base]);

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-2">LeetCode</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Query: {tagsParam ?? "(none)"} | Mutations: {Object.keys(mutations).length}
      </p>
      <ResultsClient items={items} onReview={onReview} nowMs={nowMs} />
    </main>
  );
}