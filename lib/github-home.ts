import { unstable_cache } from 'next/cache';
import {
  dateKeyInTimeZone,
  getRecentDateKeys,
  parsePublicContributionHtml,
} from './github-activity-utils';
import { createStaleWhileErrorCache } from './stale-while-error-cache';

const GITHUB_USERNAME = 'teamleaderleo';
const FEATURED_REPOSITORIES = [
  {
    name: 'smolrunner',
    url: 'https://github.com/teamleaderleo/smolrunner',
    note: 'Plans host work before mutation and treats unknown state as a reason to inspect, not guess.',
  },
  {
    name: 'stensibly',
    url: 'https://github.com/teamleaderleo/stensibly',
    note: 'Keeps responsibility, authority, evidence, and next actions in one shared ledger.',
  },
  {
    name: 'proofwake',
    url: 'https://github.com/teamleaderleo/proofwake',
    note: 'Builds a privacy-minded evidence trail around revisions, failures, recovery, and missing signals.',
  },
] as const;

export const GITHUB_ACTIVITY_FRESH_SECONDS = 300;
export const GITHUB_ACTIVITY_STALE_SECONDS = 3_600;
const RETRY_BASE_MS = 60_000;
const MAX_FAILURE_BACKOFF_MS = 15 * 60_000;
const HOME_WINDOW_DAYS = 35;

export type ContributionDay = {
  date: string;
  count: number;
};

export type GitHubRateLimit = {
  limit: number | null;
  remaining: number | null;
  used: number | null;
  resetAt: string | null;
  resource: string | null;
};

export type GitHubHomeData = {
  username: string;
  source: 'public-profile' | 'public-events' | 'unavailable';
  generatedAt: string;
  total: number | null;
  periodLabel: 'this year' | 'last 35 days';
  today: number;
  weekTotal: number;
  activeDays: number;
  currentStreak: number;
  days: ContributionDay[];
  repositories: Array<{
    name: string;
    url: string;
    note: string;
  }>;
};

export type GitHubActivityDiagnostics = {
  cacheStatus: 'hit' | 'miss' | 'stale';
  upstreamSource: GitHubHomeData['source'];
  lastUpstreamAttempt: string | null;
  lastUpstreamFetch: string | null;
  consecutiveFailures: number;
  nextRetryAt: string | null;
  rateLimit: GitHubRateLimit | null;
};

export type GitHubHomeResult = {
  activity: GitHubHomeData;
  diagnostics: GitHubActivityDiagnostics;
};

type RestEvent = {
  type: string;
  created_at: string | null;
  payload?: {
    action?: string;
    size?: number;
    distinct_size?: number;
  };
};

type ActivitySource = GitHubHomeData['source'];
type ActivitySummary = Pick<
  GitHubHomeData,
  'total' | 'periodLabel' | 'today' | 'weekTotal' | 'activeDays' | 'currentStreak' | 'days'
>;
type UpstreamActivity = {
  activity: GitHubHomeData;
  rateLimit: GitHubRateLimit | null;
};

class GitHubRestError extends Error {
  rateLimit: GitHubRateLimit | null;

  constructor(status: number, rateLimit: GitHubRateLimit | null) {
    super(`GitHub REST returned ${status}`);
    this.name = 'GitHubRestError';
    this.rateLimit = rateLimit;
  }
}

function daysFromCounts(counts: Map<string, number>, now: Date, length = HOME_WINDOW_DAYS) {
  return getRecentDateKeys(now, length).map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

function countCurrentStreak(days: ContributionDay[]): number {
  let index = days.length - 1;

  // Keep yesterday's streak visible until the current day has activity.
  if (days[index]?.count === 0) index -= 1;

  let streak = 0;
  while (index >= 0 && days[index].count > 0) {
    streak += 1;
    index -= 1;
  }

  return streak;
}

function summarizeCounts(
  counts: Map<string, number>,
  source: ActivitySource,
  now = new Date(),
): ActivitySummary {
  const days = daysFromCounts(counts, now);
  const today = dateKeyInTimeZone(now);
  const periodLabel: GitHubHomeData['periodLabel'] =
    source === 'public-profile' ? 'this year' : 'last 35 days';
  const periodEntries =
    source === 'public-profile'
      ? [...counts.entries()].filter(([date]) => date.startsWith(today.slice(0, 4)) && date <= today)
      : days.map((day) => [day.date, day.count] as const);
  const streakDays =
    source === 'public-profile' ? daysFromCounts(counts, now, 366) : days;

  return {
    total: periodEntries.reduce((sum, [, count]) => sum + count, 0),
    periodLabel,
    today: days.at(-1)?.count ?? 0,
    weekTotal: days.slice(-7).reduce((sum, day) => sum + day.count, 0),
    activeDays: periodEntries.filter(([, count]) => count > 0).length,
    currentStreak: countCurrentStreak(streakDays),
    days,
  };
}

async function fetchPublicProfileCounts(): Promise<Map<string, number>> {
  const response = await fetch(`https://github.com/users/${GITHUB_USERNAME}/contributions`, {
    cache: 'no-store',
    headers: {
      Accept: 'text/html',
      'User-Agent': 'teamleaderleo-scrapbook',
    },
  });

  if (!response.ok) throw new Error(`GitHub contribution page returned ${response.status}`);

  const counts = parsePublicContributionHtml(await response.text());
  if (counts.size === 0) throw new Error('GitHub contribution page could not be parsed');

  return counts;
}

function eventWeight(event: RestEvent): number {
  if (event.type === 'PushEvent') {
    return Math.max(event.payload?.distinct_size ?? event.payload?.size ?? 1, 1);
  }
  if (event.type === 'PullRequestEvent') return 1;
  if (event.type === 'IssuesEvent' && event.payload?.action === 'opened') return 1;
  if (event.type === 'PullRequestReviewEvent' && event.payload?.action === 'created') return 1;
  return 0;
}

function headerInteger(headers: Headers, name: string): number | null {
  const value = headers.get(name);
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseGitHubRateLimit(headers: Headers): GitHubRateLimit | null {
  const limit = headerInteger(headers, 'x-ratelimit-limit');
  const remaining = headerInteger(headers, 'x-ratelimit-remaining');
  const used = headerInteger(headers, 'x-ratelimit-used');
  const reset = headerInteger(headers, 'x-ratelimit-reset');
  const resource = headers.get('x-ratelimit-resource');

  if (limit === null && remaining === null && used === null && reset === null && resource === null) {
    return null;
  }

  return {
    limit,
    remaining,
    used,
    resetAt: reset === null ? null : new Date(reset * 1_000).toISOString(),
    resource,
  };
}

async function githubJson<T>(url: string): Promise<{ data: T; rateLimit: GitHubRateLimit | null }> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'teamleaderleo-scrapbook',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  const rateLimit = parseGitHubRateLimit(response.headers);

  if (!response.ok) throw new GitHubRestError(response.status, rateLimit);
  return { data: (await response.json()) as T, rateLimit };
}

async function fetchPublicEventCounts(): Promise<{
  counts: Map<string, number>;
  rateLimit: GitHubRateLimit | null;
}> {
  const { data: events, rateLimit } = await githubJson<RestEvent[]>(
    `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`,
  );
  const counts = new Map<string, number>();

  for (const event of events) {
    if (!event.created_at) continue;
    const weight = eventWeight(event);
    if (weight === 0) continue;
    const key = dateKeyInTimeZone(new Date(event.created_at));
    counts.set(key, (counts.get(key) ?? 0) + weight);
  }

  return { counts, rateLimit };
}

function featuredRepositories(): GitHubHomeData['repositories'] {
  return FEATURED_REPOSITORIES.map((repository) => ({ ...repository }));
}

function unavailableHomeData(now = new Date()): GitHubHomeData {
  const summary = summarizeCounts(new Map(), 'unavailable', now);
  return {
    username: GITHUB_USERNAME,
    source: 'unavailable',
    generatedAt: now.toISOString(),
    ...summary,
    total: null,
    repositories: featuredRepositories(),
  };
}

async function loadGitHubHomeData(): Promise<UpstreamActivity> {
  try {
    const summary = summarizeCounts(await fetchPublicProfileCounts(), 'public-profile');
    return {
      activity: {
        username: GITHUB_USERNAME,
        source: 'public-profile',
        generatedAt: new Date().toISOString(),
        ...summary,
        repositories: featuredRepositories(),
      },
      rateLimit: null,
    };
  } catch (profileError) {
    console.error('GitHub public contribution fetch failed', profileError);
  }

  try {
    const { counts, rateLimit } = await fetchPublicEventCounts();
    const summary = summarizeCounts(counts, 'public-events');
    return {
      activity: {
        username: GITHUB_USERNAME,
        source: 'public-events',
        generatedAt: new Date().toISOString(),
        ...summary,
        repositories: featuredRepositories(),
      },
      rateLimit,
    };
  } catch (eventError) {
    console.error('GitHub public event fetch failed', eventError);
    throw eventError;
  }
}

const getCachedUpstreamActivity = unstable_cache(
  loadGitHubHomeData,
  ['github-homepage-v6'],
  { revalidate: GITHUB_ACTIVITY_FRESH_SECONDS },
);

const githubHomeCache = createStaleWhileErrorCache<UpstreamActivity>({
  load: getCachedUpstreamActivity,
  freshForMs: GITHUB_ACTIVITY_FRESH_SECONDS * 1_000,
  staleForMs: GITHUB_ACTIVITY_STALE_SECONDS * 1_000,
  retryBaseMs: RETRY_BASE_MS,
  retryMaxMs: MAX_FAILURE_BACKOFF_MS,
});

function rateLimitFromError(error: unknown): GitHubRateLimit | null {
  return error instanceof GitHubRestError ? error.rateLimit : null;
}

export async function getGitHubHomeResult(): Promise<GitHubHomeResult> {
  const cached = await githubHomeCache.get();
  const activity = cached.value?.activity ?? unavailableHomeData();
  const rateLimit = rateLimitFromError(cached.error) ?? cached.value?.rateLimit ?? null;

  return {
    activity,
    diagnostics: {
      cacheStatus: cached.diagnostics.status,
      upstreamSource: activity.source,
      lastUpstreamAttempt: cached.diagnostics.lastAttemptAt,
      lastUpstreamFetch: cached.value?.activity.generatedAt ?? null,
      consecutiveFailures: cached.diagnostics.consecutiveFailures,
      nextRetryAt: cached.diagnostics.nextRetryAt,
      rateLimit,
    },
  };
}

export async function getGitHubHomeData(): Promise<GitHubHomeData> {
  try {
    return (await getCachedUpstreamActivity()).activity;
  } catch (error) {
    console.error('Unable to load cached GitHub homepage activity', error);
    return unavailableHomeData();
  }
}
