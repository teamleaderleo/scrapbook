"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ITEMS } from "@/app/lib/leetcode-data";
import { parseQuery } from "@/app/lib/searchlang";
import { searchLeetcode } from "@/app/lib/leetcode-search";
import { ResultsClient } from "./space-results-client";

export function SpaceView() {
  const sp = useSearchParams();
  const tagsParam = sp.get("tags") ?? undefined;

  const q = useMemo(() => parseQuery(tagsParam), [tagsParam]);
  const results = useMemo(() => searchLeetcode(ITEMS, q), [q]);

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-2">LeetCode</h1>
      <p className="text-sm text-muted-foreground mb-4">Query: {tagsParam ?? "(none)"}</p>
      <ResultsClient initialItems={results} />
      {/* Alternative non-mounting sync option <ResultsClient key={tagsParam ?? "none"} initialItems={results} /> */}
    </main>
  );
}
