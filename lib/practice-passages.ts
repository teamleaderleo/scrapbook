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
    kind: 'prose', revision: 'v1',
    text: `Two machines can both report 80% memory use and have very different room to spare. On a 16 GB machine, the remaining 20% is 3.2 GB; on a 64 GB machine, it's 12.8 GB. Even that doesn't tell the whole story. Memory used for a reclaimable cache behaves differently from memory an active process still needs. Read the amount alongside the pressure, then watch whether the machine is spending time moving data instead of doing useful work.`,
    question: 'Which extra measurement would help you decide whether to close an application?',
    alter: 'Explain why a falling free-memory number can accompany either useful caching or growing pressure.',
  },
  {
    slug: 'vm-budget', title: 'A shared machine', collection: 'Ideas',
    kind: 'prose', revision: 'v1',
    text: `A virtual machine has its own view of a computer, but its work still runs on the host. Giving a guest eight virtual CPUs doesn't create eight new physical cores. The host schedules that work alongside everything else it needs to do. A guest can look busy while the host has spare capacity, or feel slow while it waits for a shared resource. Keep both views nearby: what the guest asks for, and what the host can deliver.`,
    question: 'What would you compare if Windows felt slow while the host CPU graph looked quiet?',
    alter: 'Consider disk latency and memory pressure before assuming that adding virtual CPUs will help.',
  },
  {
    slug: 'feedback-delay', title: 'Delayed feedback', collection: 'Ideas',
    kind: 'prose', revision: 'v1',
    text: `You turn the shower warmer, wait a moment, and turn it again. The first change hasn't reached you yet; when both changes arrive, the water is too hot. A delayed signal can make a sensible correction overshoot. Dashboards have the same problem when a fresh-looking display contains old samples. Before acting on a change, ask when it was measured and whether the previous action has had time to show up.`,
    question: 'How would you tell a slow response from a correction that did nothing?',
    alter: 'Think of a dashboard where a sample timestamp would be more useful than a faster animation.',
  },
  {
    slug: 'cache-tradeoff', title: 'Keeping an old answer', collection: 'Ideas',
    kind: 'prose', revision: 'v1',
    text: `A cache keeps an answer so the next request can avoid doing the same work. The awkward part is deciding how long that answer remains useful. A weather icon can tolerate a little age; a permission decision may need a stricter rule. Expiry limits how long you reuse a value, but it doesn't prove the value was current when you stored it. Freshness belongs to the source as well as the clock on the cache.`,
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
