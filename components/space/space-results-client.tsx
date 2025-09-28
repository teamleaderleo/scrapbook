"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Rating } from "ts-fsrs";
import type { LCItem } from "@/app/lib/leetcode-data";
import { reviewOnce } from "@/app/lib/fsrs-adapter";

export function ResultsClient({ initialItems }: { initialItems: LCItem[] }) {
  const [items, setItems] = useState(initialItems);

  // Sync when url/filter changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const updateItem = (id: string, nextReview: NonNullable<LCItem["review"]>) => {
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, review: nextReview, updatedAt: Date.now() } : it))
    );
  };

  return (
    <ul className="space-y-2">
      {items.map(it => (
        <li key={it.id} className="rounded border p-3">
          <div className="flex items-center justify-between">
            <Link href={it.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
              {it.title}
            </Link>
            <span className="text-xs text-muted-foreground capitalize">{it.difficulty}</span>
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            companies: {it.companies.join(", ")} · topics: {it.topics.join(", ")}
            {it.review && (
              <>
                {" · next: "}
                {new Date(it.review.due).toLocaleDateString()}
                {" · ivl: "}{it.review.scheduled_days}d
              </>
            )}
          </div>

          {it.review && (
            <div className="flex gap-2 mt-2 text-xs">
              <button className="rounded border px-2 py-1" onClick={() => {
                const next = reviewOnce(it.review!, Rating.Again);
                updateItem(it.id, next);
              }}>Again</button>
              <button className="rounded border px-2 py-1" onClick={() => {
                const next = reviewOnce(it.review!, Rating.Hard);
                updateItem(it.id, next);
              }}>Hard</button>
              <button className="rounded border px-2 py-1" onClick={() => {
                const next = reviewOnce(it.review!, Rating.Good);
                updateItem(it.id, next);
              }}>Good</button>
              <button className="rounded border px-2 py-1" onClick={() => {
                const next = reviewOnce(it.review!, Rating.Easy);
                updateItem(it.id, next);
              }}>Easy</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
