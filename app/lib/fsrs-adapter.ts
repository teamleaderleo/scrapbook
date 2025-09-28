import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card,
  type RecordLogItem,
  type FSRS,
  generatorParameters,
} from "ts-fsrs";
import type { ReviewState } from "./review-types";


export const F: FSRS = fsrs(generatorParameters({
  request_retention: 0.9,
  maximum_interval: 36500,
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  enable_fuzz: false,
  enable_short_term: true,
}));

// Convert ReviewState to Card
function toCard(r: ReviewState | undefined, nowMs: number): Card {
  // For new or undefined cards, create an empty card
  if (!r || (r.state === State.New && r.reps === 0)) {
    const emptyCard = createEmptyCard(new Date(nowMs));
    // IMPORTANT: Set the due date to now for new cards
    emptyCard.due = new Date(nowMs);
    return emptyCard;
  }
  
  // Convert existing state
  return {
    state: r.state,
    due: new Date(r.due),
    last_review: r.last_review ? new Date(r.last_review) : null,
    stability: r.stability,
    difficulty: r.difficulty,
    elapsed_days: r.elapsed_days,
    scheduled_days: r.scheduled_days,
    learning_steps: r.learning_steps ?? 0,
    reps: r.reps,
    lapses: r.lapses,
  } as Card;
}

// Convert Card to ReviewState
function fromCard(c: Card): ReviewState {
  return {
    state: c.state,
    due: c.due.getTime(),
    last_review: c.last_review ? c.last_review.getTime() : null,
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
  };
}

// ISN'T USEFUL AT ALL
// Preview all rating options
// export function previewAll(r: ReviewState | undefined, nowMs: number): Omit<Record<Rating, RecordLogItem>, Rating.Manual> {
//   const card = toCard(r, nowMs);
//   const now = new Date(nowMs);
  
//   const schedulingCards = F.repeat(card, now);
  
//   return {
//     [Rating.Again]: schedulingCards[1],
//     [Rating.Hard]: schedulingCards[2],
//     [Rating.Good]: schedulingCards[3],
//     [Rating.Easy]: schedulingCards[4],
//   };
// }


export function reviewOnce(r: ReviewState | undefined, rating: Rating, nowMs: number): ReviewState {
  if (rating < 1 || rating > 4) {
    throw new Error(`Invalid rating: ${rating}`);
  }
  
  const card = toCard(r, nowMs);
  
  const reviewTime = new Date(nowMs);
  
  const schedulingCards = F.repeat(card, reviewTime);
  const selected = schedulingCards[rating as Rating.Again | Rating.Hard | Rating.Good | Rating.Easy];
  
  if (!selected) {
    throw new Error(`No scheduling card for rating ${rating}`);
  }
  
  return fromCard(selected.card);
}

// Get retrievability for sorting
export function retrievabilityNow(r: ReviewState | undefined, nowMs: number): number {
  const card = toCard(r, nowMs);
  return F.get_retrievability(card, new Date(nowMs), false);
}

// Debug helper with more detail
export function debugCard(r: ReviewState | undefined, label: string = ""): void {
  if (!r) {
    console.log(`${label} - No review state`);
    return;
  }
  
  const stateNames = ["New", "Learning", "Review", "Relearning"];
  console.log(
    `${label} - State: ${stateNames[r.state]} (${r.state}), ` +
    `Reps: ${r.reps}, Lapses: ${r.lapses}, ` +
    `Due: ${new Date(r.due).toLocaleString()}, ` +
    `Stability: ${r.stability?.toFixed(2)}, ` +
    `Difficulty: ${r.difficulty?.toFixed(2)} `
  );
}