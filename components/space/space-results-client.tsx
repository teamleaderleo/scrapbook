"use client";
import Link from "next/link";
import { useState } from "react";
import { Rating } from "ts-fsrs";
// import { previewAll } from "@/app/lib/fsrs-adapter";
import type { LCItem } from "@/app/lib/leetcode-data";
import { formatInterval, formatDueRelative } from "@/app/lib/interval-format";

export function ResultsClient({
  items,
  onReview,
  nowMs,
}: {
  items: LCItem[];
  onReview: (id: string, rating: Rating) => void;
  nowMs: number;
}) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <Row key={it.id} it={it} onReview={onReview} nowMs={nowMs} />
      ))}
    </ul>
  );
}

function Row({ it, onReview, nowMs }: { it: LCItem; onReview: (id: string, r: Rating) => void; nowMs: number }) {
  // const [showPrev, setShowPrev] = useState(false);
  // const previews = it.review && showPrev ? previewAll(it.review, nowMs) : null;

  return (
    <li className="rounded border p-3">
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
            {formatDueRelative(nowMs, new Date(it.review.due))}
            {" · ivl: "}
            {formatInterval(nowMs, new Date(it.review.due), it.review.scheduled_days)}
            {it.review.due <= nowMs && (
              <span className="ml-2 rounded bg-red-100 text-red-700 px-1 py-0.5">due</span>
            )}
          </>
        )}
      </div>

      {it.review && (
        <>
          <div className="flex gap-2 mt-2 text-xs">
            <button className="rounded border px-2 py-1" onClick={() => onReview(it.id, Rating.Again)}>Again</button>
            <button className="rounded border px-2 py-1" onClick={() => onReview(it.id, Rating.Hard)}>Hard</button>
            <button className="rounded border px-2 py-1" onClick={() => onReview(it.id, Rating.Good)}>Good</button>
            <button className="rounded border px-2 py-1" onClick={() => onReview(it.id, Rating.Easy)}>Easy</button>
            {/* <button className="ml-auto text-xs underline" onClick={() => setShowPrev(v => !v)}>
              {showPrev ? "hide preview" : "preview"}
            </button> */}
          </div>

          {/* {previews && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              {([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as const).map((r) => {
                const rec = previews[r];
                return (
                  <div key={r} className="rounded border p-2">
                    <div className="font-medium">
                      {r === Rating.Again ? "Again" : r === Rating.Hard ? "Hard" : r === Rating.Good ? "Good" : "Easy"}
                    </div>
                    <div>due: {rec.log.due.toLocaleDateString()}</div>
                    <div>ivl: {rec.log.scheduled_days}d</div>
                  </div>
                );
              })}
            </div>
          )} */}
        </>
      )}
    </li>
  );
}
