export interface SpaceCard {
  id: string;
  slug: string;
  question: string;
  answer: string;  // markdown content
  category: string;
  tags?: string[];
  
  // Spaced repetition algorithm fields (SM-2)
  dueDate: Date;
  interval: number;        // Days until next review
  easeFactor: number;      // 1.3 to 2.5+ (difficulty multiplier)
  repetitions: number;     // How many times reviewed
  
  // Optional metadata
  createdDate: Date;
  lastReviewed?: Date;
  sourceUrl?: string;      // If imported from a link
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0: Complete blackout, 1: Incorrect with correct answer easy to recall
// 2: Incorrect with correct answer hard to recall, 3: Correct with serious difficulty
// 4: Correct after hesitation, 5: Perfect response

export interface ReviewResult {
  quality: ReviewQuality;
  newInterval: number;
  newEaseFactor: number;
  newDueDate: Date;
}