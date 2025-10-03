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

  const items = useMemo<LCItem[]>(
    () =>
      base.map((it) => {
        const mutation = mutations[it.id];
        return mutation ? { ...it, review: mutation } : it;
      }),
    [base, mutations]
  );

  const onReview = useCallback((id: string, rating: Rating) => {
    
    console.group(`Review: ${id} with Rating.${Rating[rating]}`);
    
    setMutations(prev => {
      const current = prev[id] ?? base.find(x => x.id === id)?.review;
      
      debugCard(current, "BEFORE");
      
      const next = reviewOnce(current, rating, Date.now());
      
      debugCard(next, "AFTER");
      
      return { ...prev, [id]: next };
    });
  }, [base]);

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-2">LeetCode</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Query: {tagsParam ?? "(none)"}
      </p>
      <ResultsClient items={items} onReview={onReview} nowMs={nowMs} />
    </main>
  );
}