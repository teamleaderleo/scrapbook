import { State } from "ts-fsrs";
import type { LCItem } from "./leetcode-data";
import type { ReviewState } from "./review-types";

export function ensureSeedReview(items: LCItem[], now: number): LCItem[] {
  return items.map(it => it.review ? it : ({
    ...it,
    review: {
      state: State.New,
      due: now,
      last_review: null,
      stability: 0,
      difficulty: 0,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 0,
      suspended: false,
    } satisfies ReviewState
  }));
}
