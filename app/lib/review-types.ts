import type { State } from "ts-fsrs";

export type ReviewState = {
  // FSRS “Card” fields we care about
  due: number;                // ms epoch
  stability: number;          // days (interval when R=target)
  difficulty: number;         // ~1..10
  elapsed_days: number;       // deprecated upstream, keep for now
  scheduled_days: number;     // next interval (days)
  learning_steps: number;     // internal counter
  reps: number;
  lapses: number;
  state: State;               // 0=New,1=Learning,2=Review,3=Relearning
  last_review?: number | null;
  suspended?: boolean;        // optional app flag (not FSRS core)
};
