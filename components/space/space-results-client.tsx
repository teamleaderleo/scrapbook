"use client";
import Link from "next/link";
import { Rating } from "ts-fsrs";
import type { LCItem } from "@/app/lib/leetcode-data";

export function ResultsClient({
  items,
  onReview,
}: {
  items: LCItem[];
  onReview: (id: string, rating: Rating) => void;
}) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.id} className="rounded border p-3">
          <div className="flex items-center justify-between">
            <Link
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
            >
              {it.title}
            </Link>
            <span className="text-xs text-muted-foreground capitalize">
              {it.difficulty}
            </span>
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            companies: {it.companies.join(", ")} · topics: {it.topics.join(", ")}
            {it.review && (
              <>
                {" · next: "}
                {new Date(it.review.due).toLocaleDateString()}
                {" · ivl: "}
                {it.review.scheduled_days}d
              </>
            )}
          </div>

          {it.review && (
            <div className="flex gap-2 mt-2 text-xs">
              <button
                className="rounded border px-2 py-1"
                onClick={() => onReview(it.id, Rating.Again)}
              >
                Again
              </button>
              <button
                className="rounded border px-2 py-1"
                onClick={() => onReview(it.id, Rating.Hard)}
              >
                Hard
              </button>
              <button
                className="rounded border px-2 py-1"
                onClick={() => onReview(it.id, Rating.Good)}
              >
                Good
              </button>
              <button
                className="rounded border px-2 py-1"
                onClick={() => onReview(it.id, Rating.Easy)}
              >
                Easy
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
