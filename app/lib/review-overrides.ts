import type { ReviewState } from './review-types';

export type ReviewOverrides = Record<string, ReviewState>;

export function rollbackFailedReview(
  overrides: ReviewOverrides,
  itemId: string,
  failedReview: ReviewState,
  previousOverride: ReviewState | undefined,
): ReviewOverrides {
  if (overrides[itemId] !== failedReview) {
    return overrides;
  }

  if (previousOverride) {
    return { ...overrides, [itemId]: previousOverride };
  }

  const next = { ...overrides };
  delete next[itemId];
  return next;
}
