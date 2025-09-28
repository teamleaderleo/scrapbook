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
  enable_short_term: true,  // can tweak to false or customize steps
  // learning_steps: ["10m","30m","2h","1d"],
  // relearning_steps: ["10m","30m"],
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
export function toCardInput(r: ReviewState, nowMs: number): CardInput {
  return {
    state: r.state,
    due: r.due ?? nowMs,
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
    elapsed_days: log.elapsed_days, // deprecated upstream, keep for now for some reason
    scheduled_days: log.scheduled_days,
    learning_steps: log.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: +log.review,
  };
}

// Preview all possible buttons (Again/Hard/Good/Easy) without committing
export function previewAll(r: ReviewState, nowMs: number) {
  const it = F.repeat(toCardInput(r, nowMs), new Date(nowMs));
  // Not sure why we use partial here
  const out: Partial<Record<Rating, RecordLogItem>> = {};
  for (const rec of it) {
    out[rec.log.rating as Rating] = rec;
  }
  return out as Record<Rating, RecordLogItem>;
}

// Commit a review with one rating, return updated ReviewState
export function reviewOnce(r: ReviewState, rating: Rating, nowMs: number): ReviewState {
  const rec = F.next(toCardInput(r, nowMs), new Date(nowMs), toGrade(rating));
  return fromRecordLogItem(rec);
}

// For fsrs urgency sorting
export function retrievabilityNow(r: ReviewState, nowMs: number): number {
  return F.get_retrievability(toCardInput(r, nowMs), new Date(nowMs), false);
}
