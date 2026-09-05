import { z } from 'zod';

import {
  projectWorkerOutcomeAttention,
  type WorkerOutcomeAttention,
  type WorkerOutcomeAssignment,
} from './worker-outcome-attention';

const CANONICAL_OWNER = 'teamleaderleo';
const CANONICAL_REPO = 'scrapbook';
const GITHUB_API_VERSION = '2022-11-28';
const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_OPEN_PULLS = 30;
const MAX_DETAIL_PULLS = 8;

type FetchLike = typeof fetch;

export type WorkerOutcomeSnapshot =
  | { status: 'ready'; attention: WorkerOutcomeAttention }
  | { status: 'unavailable'; observed_at: string; reason: string };

const openPullSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  draft: z.boolean().optional(),
  updated_at: z.string(),
  html_url: z.string().url(),
  head: z.object({ sha: z.string().min(1).max(128) }).optional(),
});

const reviewSchema = z.object({
  state: z.string(),
  submitted_at: z.string().nullable().optional(),
});

const checkRunSchema = z.object({
  status: z.string().nullable().optional(),
  conclusion: z.string().nullable().optional(),
});

const checkRunsSchema = z.object({
  check_runs: z.array(checkRunSchema),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function getJson(
  fetchImpl: FetchLike,
  url: string
): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
        'User-Agent': 'scrapbook-worker-outcome-attention',
      },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function reviewDecision(
  reviews: ReadonlyArray<{ state: string }>
): WorkerOutcomeAssignment['review_decision'] {
  let latest: string | null = null;
  for (const review of reviews) {
    if (review.state === 'COMMENTED') continue;
    latest = review.state;
  }
  if (latest === 'APPROVED') return 'approved';
  if (latest === 'CHANGES_REQUESTED') return 'changes-requested';
  return 'review-required';
}

function checkState(
  runs: ReadonlyArray<{ status?: string | null; conclusion?: string | null }>
): WorkerOutcomeAssignment['checks'] {
  if (runs.length === 0) return null;
  const conclusions = new Set(
    runs.map(run => run.conclusion ?? run.status ?? null)
  );
  if (
    ['failure', 'timed_out', 'cancelled', 'action_required', 'stale'].some(
      conclusion => conclusions.has(conclusion)
    )
  )
    return 'failing';
  if (
    [
      'in_progress',
      'queued',
      'pending',
      'waiting',
      'requested',
      'expected',
    ].some(conclusion => conclusions.has(conclusion))
  )
    return 'pending';
  if (conclusions.has(null)) return null;
  return 'passing';
}

async function enrichPull(
  fetchImpl: FetchLike,
  assignment: WorkerOutcomeAssignment,
  headSha: string | null,
  pullNumber: number
): Promise<WorkerOutcomeAssignment> {
  const [reviewsJson, checksJson] = await Promise.all([
    getJson(
      fetchImpl,
      `https://api.github.com/repos/${CANONICAL_OWNER}/${CANONICAL_REPO}/pulls/${pullNumber}/reviews?per_page=30`
    ),
    headSha
      ? getJson(
          fetchImpl,
          `https://api.github.com/repos/${CANONICAL_OWNER}/${CANONICAL_REPO}/commits/${headSha}/check-runs?per_page=100`
        )
      : Promise.resolve(null),
  ]);
  let review_decision: WorkerOutcomeAssignment['review_decision'] = null;
  let checks: WorkerOutcomeAssignment['checks'] = null;
  if (Array.isArray(reviewsJson)) {
    const parsed = z.array(reviewSchema).safeParse(reviewsJson);
    if (parsed.success && parsed.data.length > 0)
      review_decision = reviewDecision(parsed.data);
    else if (parsed.success) review_decision = 'review-required';
  }
  if (isRecord(checksJson)) {
    const parsed = checkRunsSchema.safeParse(checksJson);
    if (parsed.success) checks = checkState(parsed.data.check_runs);
  }
  return { ...assignment, review_decision, checks };
}

export async function readWorkerOutcomeSnapshot(
  fetchImpl: FetchLike = fetch,
  now: Date = new Date()
): Promise<WorkerOutcomeSnapshot> {
  const observed_at = now.toISOString();
  const pullsJson = await getJson(
    fetchImpl,
    `https://api.github.com/repos/${CANONICAL_OWNER}/${CANONICAL_REPO}/pulls?state=open&per_page=${MAX_OPEN_PULLS}&sort=updated&direction=desc`
  );
  if (!Array.isArray(pullsJson))
    return {
      status: 'unavailable',
      observed_at,
      reason: 'assignment transport unreachable',
    };
  const parsed = z.array(openPullSchema).safeParse(pullsJson);
  if (!parsed.success)
    return {
      status: 'unavailable',
      observed_at,
      reason: 'assignment payload unrecognized',
    };
  const base: Array<{
    assignment: WorkerOutcomeAssignment;
    headSha: string | null;
    pullNumber: number;
  }> = [];
  for (const pull of parsed.data) {
    const updated = Date.parse(pull.updated_at);
    base.push({
      assignment: {
        assignment_id: `pr-${pull.number}`,
        title: pull.title.slice(0, 256).trim() || `Pull request ${pull.number}`,
        kind: 'pull-request',
        state: 'open',
        draft: pull.draft ?? null,
        review_decision: null,
        checks: null,
        updated_at: Number.isNaN(updated)
          ? observed_at
          : new Date(updated).toISOString(),
        artifact_url: pull.html_url,
      },
      headSha: pull.head?.sha ?? null,
      pullNumber: pull.number,
    });
  }
  const assignments = await Promise.all(
    base.map((entry, index) =>
      index < MAX_DETAIL_PULLS
        ? enrichPull(
            fetchImpl,
            entry.assignment,
            entry.headSha,
            entry.pullNumber
          ).catch(() => entry.assignment)
        : entry.assignment
    )
  );
  return {
    status: 'ready',
    attention: projectWorkerOutcomeAttention({
      schema: 'worker-outcome-report/v1',
      observed_at,
      assignments,
    }),
  };
}
