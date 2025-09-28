import { State } from "ts-fsrs";
import type { LCItem } from "./leetcode-data";
import type { ReviewState } from "./review-types";

export function ensureSeedReview(items: LCItem[], now = Date.now()): LCItem[] {
  return items.map((it) => {
    if (it.review) return it;
    const review: ReviewState = {
      state: State.New,
      due: now,
      last_review: null,
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 0,
      suspended: false,
    };
    return { ...it, review };
  });
}
