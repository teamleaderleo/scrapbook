import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card,
  type FSRS,
  generatorParameters,
} from "ts-fsrs";
import type { ReviewState } from "./review-types";

type ReviewRating = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

export const F: FSRS = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 36500,
    w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
    enable_fuzz: false,
    enable_short_term: true,
  }),
);

function toCard(review: ReviewState | undefined, nowMs: number): Card {
  if (!review || (review.state === State.New && review.reps === 0)) {
    const emptyCard = createEmptyCard(new Date(nowMs));
    emptyCard.due = new Date(nowMs);
    return emptyCard;
  }

  return {
    state: review.state,
    due: new Date(review.due),
    last_review: review.last_review ? new Date(review.last_review) : null,
    stability: review.stability,
    difficulty: review.difficulty,
    scheduled_days: review.scheduled_days,
    learning_steps: review.learning_steps ?? 0,
    reps: review.reps,
    lapses: review.lapses,
  } as Card;
}

function fromCard(card: Card): ReviewState {
  return {
    state: card.state,
    due: card.due.getTime(),
    last_review: card.last_review ? card.last_review.getTime() : null,
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
  };
}

export function reviewOnce(review: ReviewState | undefined, rating: Rating, nowMs: number): ReviewState {
  if (rating < Rating.Again || rating > Rating.Easy) {
    throw new Error(`Invalid rating: ${rating}`);
  }

  const schedulingCards = F.repeat(toCard(review, nowMs), new Date(nowMs));
  const selected = schedulingCards[rating as ReviewRating];

  if (!selected) {
    throw new Error(`No scheduling card for rating ${rating}`);
  }

  return fromCard(selected.card);
}

export function retrievabilityNow(review: ReviewState | undefined, nowMs: number): number {
  return F.get_retrievability(toCard(review, nowMs), new Date(nowMs), false);
}
