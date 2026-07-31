import { describe, expect, it } from 'vitest';
import { State } from 'ts-fsrs';
import type { ReviewState } from './review-types';
import { rollbackFailedReview } from './review-overrides';

function review(due: number, reps: number): ReviewState {
  return {
    due,
    stability: 1,
    difficulty: 5,
    scheduled_days: 1,
    learning_steps: 0,
    reps,
    lapses: 0,
    state: State.Review,
    last_review: due - 1000,
  };
}

describe('rollbackFailedReview', () => {
  it('removes a failed optimistic override when no earlier override existed', () => {
    const failed = review(2000, 1);
    expect(rollbackFailedReview({ item: failed }, 'item', failed, undefined)).toEqual({});
  });

  it('restores the previous override after a failed save', () => {
    const previous = review(1000, 1);
    const failed = review(2000, 2);
    expect(rollbackFailedReview({ item: failed }, 'item', failed, previous)).toEqual({ item: previous });
  });

  it('does not overwrite a newer optimistic review', () => {
    const previous = review(1000, 1);
    const failed = review(2000, 2);
    const newer = review(3000, 3);
    const overrides = { item: newer };

    expect(rollbackFailedReview(overrides, 'item', failed, previous)).toBe(overrides);
  });
});
