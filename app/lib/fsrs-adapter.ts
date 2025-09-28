import {
  fsrs,                   // factory -> FSRS instance
  Rating,                 // enum { Manual, Again, Hard, Good, Easy }
  State,                  // enum { New, Learning, Review, Relearning }
  type Card,
  type CardInput,
  type RecordLogItem,
  type Grade,
} from "ts-fsrs";
import type { ReviewState } from "./review-types";

// Create a single FSRS instance (we might wanna adjust what goes on here)
export const F = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: false,
  enable_short_term: true,
  // learning_steps / relearning_steps can be customized too
});

// helper: Rating -> Grade (remove the first indexed thing, "Manual")
function toGrade(r: Rating): Grade {
  if (r === Rating.Manual) {
    throw new Error("Grade cannot be Manual (Rating.Manual). Use Again/Hard/Good/Easy.");
  }
  // Rating.Again..Easy are 1..4, which matches Grade's domain
  return r as unknown as Grade;
}

// Convert stored ReviewState -> FSRS CardInput
export function toCardInput(r: ReviewState, now = Date.now()): CardInput {
  return {
    state: r.state, // can pass the numeric State enum directly
    due: r.due ?? now,
    last_review: r.last_review ?? null,
    stability: r.stability ?? 0,
    difficulty: r.difficulty ?? 0,
    elapsed_days: r.elapsed_days ?? 0,
    scheduled_days: r.scheduled_days ?? 0,
    learning_steps: r.learning_steps ?? 0,
    reps: r.reps ?? 0,
    lapses: r.lapses ?? 0,
  };
}

// Convert FSRS return (RecordLogItem) -> ReviewState
export function fromRecordLogItem(rec: RecordLogItem): ReviewState {
  const { card, log } = rec;
  return {
    due: +log.due,
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,     // still present in current typings
    scheduled_days: log.scheduled_days,
    learning_steps: log.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: +log.review,
  };
}

// Preview all possible buttons (Again/Hard/Good/Easy) without committing
export function previewAll(r: ReviewState, now = Date.now()) {
  const it = F.repeat(toCardInput(r, now), new Date(now))[Symbol.iterator]();
  // iterator yields 4 entries in Again..Easy order
  const results: Record<Rating, RecordLogItem> = {} as any;
  for (const rec of F.repeat(toCardInput(r, now), new Date(now))) {
    results[rec.log.rating as Rating] = rec;
  }
  return results;
}

// Commit a review with one rating, return updated ReviewState
export function reviewOnce(r: ReviewState, rating: Rating | Grade, now = Date.now()): ReviewState {
  const grade = typeof rating === "number" ? (rating as Rating) : Rating.Good; // TS appeasement; we convert back next line
  const rec = F.next(toCardInput(r, now), new Date(now), toGrade(grade));
  return fromRecordLogItem(rec);
}

// Optional: compute retrievability now (0..1) for ordering
export function retrievabilityNow(r: ReviewState, now = Date.now()): number {
  const card = toCardInput(r, now);
  return F.get_retrievability(card, new Date(now), false);
}
