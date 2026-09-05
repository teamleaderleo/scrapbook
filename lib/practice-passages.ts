import { codeExercises, practiceRevision } from './code-practice';

export type PracticePassage = {
  slug: string;
  title: string;
  collection: 'Scrapbook' | 'Patterns' | 'Ideas';
  kind: 'code' | 'prose';
  revision: string;
  text: string;
  question: string;
  alter: string;
  line?: number;
};

// Original teaching examples. Revise an entry's version when its text changes
// so timing comparisons and notes keep referring to the same passage.
export const originalPassages: PracticePassage[] = [
  {
    slug: 'cache-expiry', title: 'Cache expiry', collection: 'Patterns',
    kind: 'code', revision: 'v1',
    text: `function readFresh<T>(
  entry: { value: T; savedAt: number } | undefined,
  now: number,
  ttl: number
): T | undefined {
  if (!entry) return undefined;
  const age = now - entry.savedAt;
  if (age < 0 || age >= ttl) return undefined;
  return entry.value;
}`,
    question: 'At the exact expiry time, is the value still fresh? Why reject a negative age?',
    alter: 'Assume finite timestamps and a positive TTL in milliseconds. Trace an entry saved at 1000 with a TTL of 500, read at 1499 and then 1500.',
  },
  {
    slug: 'counter-rate', title: 'Counter to rate', collection: 'Patterns',
    kind: 'code', revision: 'v1',
    text: `function bytesPerSecond(
  previous: number,
  current: number,
  elapsedMs: number
): number | null {
  if (elapsedMs <= 0 || current < previous) return null;
  const transferred = current - previous;
  return transferred * 1_000 / elapsedMs;
}`,
    question: 'Why does a counter reset produce null instead of zero?',
    alter: 'Assume finite, non-negative byte counters. Trace 12000 to 15000 over 1500 ms, then a reset to 200. How should a graph show the missing interval?',
  },
  {
    slug: 'rolling-window', title: 'Rolling window', collection: 'Patterns',
    kind: 'code', revision: 'v1',
    text: `function appendSample(
  samples: readonly number[],
  next: number,
  capacity: number
): number[] {
  if (!Number.isInteger(capacity) || capacity <= 0) return [];
  const keep = Math.max(0, capacity - 1);
  const tail = keep === 0 ? [] : samples.slice(-keep);
  return [...tail, next];
}`,
    question: 'Why does keeping zero samples need care when using a negative slice index?',
    alter: 'Trace capacities 1 and 3. What would happen at capacity 1 if you used samples.slice(-keep) without the branch?',
  },
  {
    slug: 'state-transition', title: 'State transitions', collection: 'Patterns',
    kind: 'code', revision: 'v1',
    text: `type State = 'idle' | 'running' | 'paused';
type Action = 'start' | 'pause' | 'reset';

function transition(state: State, action: Action): State {
  if (action === 'reset') return 'idle';
  if (action === 'start') return 'running';
  if (action === 'pause' && state === 'running') return 'paused';
  return state;
}`,
    question: 'What happens when pause arrives twice? Which actions are safe to repeat?',
    alter: 'Follow start, pause, pause, start, reset from idle. Then consider a finished state: should start resume it or begin a new attempt?',
  },
  {
    slug: 'memory-headroom', title: 'Memory headroom', collection: 'Ideas',
    kind: 'prose', revision: 'v2',
    text: `At 80% memory use, a 16 GB machine has 3.2 GB left; a 64 GB machine has 12.8 GB. Some used memory can be reclaimed from caches; active processes may still need theirs. Check memory pressure as well as capacity.`,
    question: 'Which extra measurement would help you decide whether to close an application?',
    alter: 'Explain why a falling free-memory number can accompany either useful caching or growing pressure.',
  },
  {
    slug: 'vm-budget', title: 'A shared machine', collection: 'Ideas',
    kind: 'prose', revision: 'v2',
    text: `Virtual CPUs share the host's physical cores. Adding more lets a guest schedule more work at once, but doesn't create capacity. If the guest is waiting for disk or memory, extra CPUs may do little. Compare the guest's workload with the host's available resources.`,
    question: 'What would you compare if Windows felt slow while the host CPU graph looked quiet?',
    alter: 'Consider disk latency and memory pressure before assuming that adding virtual CPUs will help.',
  },
  {
    slug: 'feedback-delay', title: 'Delayed feedback', collection: 'Ideas',
    kind: 'prose', revision: 'v2',
    text: `Turn the shower warmer twice before the first change arrives and the water may get too hot. Delayed feedback can make a correction overshoot. On a dashboard, check the sample timestamp before deciding whether your last change worked.`,
    question: 'How would you tell a slow response from a correction that did nothing?',
    alter: 'Think of a dashboard where a sample timestamp would be more useful than a faster animation.',
  },
  {
    slug: 'cache-tradeoff', title: 'Keeping an old answer', collection: 'Ideas',
    kind: 'prose', revision: 'v2',
    text: `A cache reuses an answer until it expires. That limits reuse, but doesn't prove the answer was fresh when it arrived. A measurement taken an hour ago is still an hour old when you cache it. Track the measurement time as well as the storage time.`,
    question: 'Can a newly filled cache already contain stale information?',
    alter: 'Distinguish the time a measurement was taken from the time your application received it.',
  },
];

export const practicePassages: PracticePassage[] = [
  ...codeExercises.map(exercise => ({
    ...exercise,
    collection: 'Scrapbook' as const,
    kind: 'code' as const,
    revision: practiceRevision,
  })),
  ...originalPassages,
];
