"use client";
import Link from "next/link";
import { Rating } from "ts-fsrs";
import type { Item } from "@/app/lib/item-types";
import { formatInterval, formatDueRelative } from "@/app/lib/interval-format";
import { useState } from "react";
import { supabase } from "@/app/lib/db/supabase";

export function ResultsClient({
  items,
  onReview,
  onEnroll,
  nowMs,
}: {
  items: Item[];
  onReview: (id: string, rating: Rating) => void;
  onEnroll: (id: string) => void;
  nowMs: number;
}) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <Row key={it.id} it={it} onReview={onReview} onEnroll={onEnroll} nowMs={nowMs} />
      ))}
    </ul>
  );
}

function Row({ 
  it, 
  onReview, 
  onEnroll, 
  nowMs 
}: { 
  it: Item; 
  onReview: (id: string, r: Rating) => void; 
  onEnroll: (id: string) => void;
  nowMs: number;
}) {
  // Extract display tags (strip namespaces for cleaner display)
  const displayTags = it.tags.map(t => t.includes(':') ? t.split(':')[1] : t);

  return (
    <li className="rounded border p-3">
      <div className="flex items-center justify-between">
        {it.url ? (
          <Link href={it.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
            {it.title}
          </Link>
        ) : (
          <span className="font-medium">{it.title}</span>
        )}
        <span className="text-xs text-muted-foreground capitalize">{it.category}</span>
      </div>

      <div className="mt-1 text-xs text-muted-foreground">
        tags: {displayTags.join(", ")}
        {it.review && (
          <>
            {" · next: "}
            {formatDueRelative(nowMs, new Date(it.review.due))}
            {" · ivl: "}
            {formatInterval(nowMs, new Date(it.review.due), it.review.scheduled_days)}
            {it.review.due <= nowMs && (
              <span className="ml-2 rounded bg-red-100 text-red-700 px-1 py-0.5">due</span>
            )}
          </>
        )}
      </div>

      {!it.review ? (
        <button 
          className="mt-2 rounded border px-2 py-1 text-xs hover:bg-gray-50"
          onClick={() => onEnroll(it.id)}
        >
          Add to reviews
        </button>
       ) : (
        <div className="flex gap-2 mt-2 text-xs">
          <button className="rounded border px-2 py-1" onClick={() => onReview(it.id, Rating.Again)}>Again</button>
          <button className="rounded border px-2 py-1" onClick={() => onReview(it.id, Rating.Hard)}>Hard</button>
          <button className="rounded border px-2 py-1" onClick={() => onReview(it.id, Rating.Good)}>Good</button>
          <button className="rounded border px-2 py-1" onClick={() => onReview(it.id, Rating.Easy)}>Easy</button>
        </div>
      )}
    </li>
  );
}