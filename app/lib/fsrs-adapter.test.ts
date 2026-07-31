import { describe, expect, it } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import type { ReviewState } from './review-types';
import { retrievabilityNow, reviewOnce } from './fsrs-adapter';

const nowMs = Date.UTC(2026, 6, 31, 12, 0, 0);

describe('reviewOnce', () => {
  it('rejects ratings outside the FSRS response range', () => {
    expect(() => reviewOnce(undefined, 0 as Rating, nowMs)).toThrow('Invalid rating: 0');
    expect(() => reviewOnce(undefined, 5 as Rating, nowMs)).toThrow('Invalid rating: 5');
  });

  it('schedules a new card from the supplied review time', () => {
    const next = reviewOnce(undefined, Rating.Good, nowMs);

    expect(next.reps).toBe(1);
    expect(next.last_review).toBe(nowMs);
    expect(next.due).toBeGreaterThan(nowMs);
    expect(Number.isFinite(next.stability)).toBe(true);
    expect(Number.isFinite(next.difficulty)).toBe(true);
  });

  it('does not mutate an existing review state', () => {
    const current: ReviewState = {
      due: nowMs,
      stability: 3,
      difficulty: 5,
      scheduled_days: 3,
      learning_steps: 0,
      reps: 4,
      lapses: 1,
      state: State.Review,
      last_review: nowMs - 3 * 86_400_000,
    };
    const snapshot = structuredClone(current);

    const next = reviewOnce(current, Rating.Easy, nowMs);

    expect(current).toEqual(snapshot);
    expect(next.last_review).toBe(nowMs);
    expect(next.reps).toBeGreaterThan(current.reps);
    expect(next.due).toBeGreaterThan(nowMs);
  });
});

describe('retrievabilityNow', () => {
  it('returns a bounded value for a scheduled card', () => {
    const review = reviewOnce(undefined, Rating.Good, nowMs);
    const retrievability = retrievabilityNow(review, nowMs);

    expect(retrievability).toBeGreaterThanOrEqual(0);
    expect(retrievability).toBeLessThanOrEqual(1);
  });
});
