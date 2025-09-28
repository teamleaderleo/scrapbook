"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseQuery } from "@/app/lib/searchlang";
import { searchLeetcode } from "@/app/lib/leetcode-search";
import type { LCItem } from "@/app/lib/leetcode-data";
import type { ReviewState } from "@/app/lib/review-types";
import { reviewOnce } from "@/app/lib/fsrs-adapter";
import { ResultsClient } from "./space-results-client";
import { Rating } from "ts-fsrs";

export function SpaceView({
  serverNow,
  seeded,
}: { serverNow: number; seeded: LCItem[] }) {
  if (!Number.isFinite(serverNow)) throw new Error(`serverNow not finite: ${serverNow}`);
  
  const sp = useSearchParams();
  const tagsParam = sp.get("tags") ?? undefined;

  // 1) derive base list from URL (no app state here)
  const q = useMemo(() => parseQuery(tagsParam), [tagsParam]);

  // pass the same 'now' into search (so 'is:due' is stable)
  const base = useMemo(() => searchLeetcode(seeded, q, serverNow), [seeded, q, serverNow]);

  // 2) hold only the *mutations* we make via FSRS clicks (id -> ReviewState)
  const [mutations, setMutations] = useState<Record<string, ReviewState>>({});

  // 3) overlay mutations onto the base list so the list stays pure/derived
  const items = useMemo<LCItem[]>(
    () =>
      base.map((it) =>
        mutations[it.id] ? { ...it, review: mutations[it.id] } : it
      ),
    [base, mutations]
  );

  // 4) handler the list can call for Again/Hard/Good/Easy
  const onReview = (id: string, rating: Rating) => {
    setMutations(prev => {
      const current = prev[id] ?? base.find(x => x.id === id)?.review!;
      const next = reviewOnce(current, rating, serverNow);
      return { ...prev, [id]: next };
    });
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-2">LeetCode</h1>
      <p className="text-sm text-muted-foreground mb-4">Query: {tagsParam ?? "(none)"} </p>
      <ResultsClient items={items} onReview={onReview} nowMs={serverNow} />
    </main>
  );
}
