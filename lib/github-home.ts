import { unstable_cache } from 'next/cache';
import { fetchGitHubContributionCalendar } from './github-contribution-calendar';
import {
  dateKeyInTimeZone,
  getRecentDateKeys,
  parsePublicContributionHtml,
  parsePublicContributionTotal,
} from './github-activity-utils';
import {
  GITHUB_ACTIVITY_INSTANCE_FRESH_MS,
  GITHUB_ACTIVITY_RETRY_BASE_MS,
  GITHUB_ACTIVITY_RETRY_MAX_MS,
  GITHUB_ACTIVITY_STALE_SECONDS,
  GITHUB_ACTIVITY_UPSTREAM_FRESH_SECONDS,
} from './github-activity-policy';
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

const HOME_WINDOW_DAYS = 35;
const UPSTREAM_TIMEOUT_MS = 8_000;

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
  source: 'github-graphql' | 'public-profile' | 'unavailable';
  generatedAt: string;
  total: number | null;
  periodLabel: 'last year' | 'last 35 days';
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

type ActivitySource = GitHubHomeData['source'];
type ActivitySummary = Pick<
  GitHubHomeData,
  'total' | 'periodLabel' | 'today' | 'weekTotal' | 'activeDays' | 'currentStreak' | 'days'
>;
type UpstreamActivity = {
  activity: GitHubHomeData;
  rateLimit: GitHubRateLimit | null;
};

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
  reportedTotal: number | null = null,
): ActivitySummary {
  const days = daysFromCounts(counts, now);
  const today = dateKeyInTimeZone(now);
  const hasRollingYearCalendar = source !== 'unavailable';
  const periodLabel: GitHubHomeData['periodLabel'] = hasRollingYearCalendar
    ? 'last year'
    : 'last 35 days';
  const periodEntries = hasRollingYearCalendar
    ? [...counts.entries()].filter(([date]) => date <= today)
    : days.map((day) => [day.date, day.count] as const);
  const streakDays = hasRollingYearCalendar ? daysFromCounts(counts, now, 366) : days;
  const calculatedTotal = periodEntries.reduce((sum, [, count]) => sum + count, 0);

  return {
    total: hasRollingYearCalendar && reportedTotal !== null ? reportedTotal : calculatedTotal,
    periodLabel,
    today: days.at(-1)?.count ?? 0,
    weekTotal: days.slice(-7).reduce((sum, day) => sum + day.count, 0),
    activeDays: periodEntries.filter(([, count]) => count > 0).length,
    currentStreak: countCurrentStreak(streakDays),
    days,
  };
}

async function fetchPublicProfileCounts(): Promise<{
  counts: Map<string, number>;
  total: number | null;
}> {
  const response = await fetch(`https://github.com/users/${GITHUB_USERNAME}/contributions`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      Accept: 'text/html',
      'User-Agent': 'teamleaderleo-scrapbook',
    },
  });

  if (!response.ok) throw new Error(`GitHub contribution page returned ${response.status}`);

  const html = await response.text();
  const counts = parsePublicContributionHtml(html);
  if (counts.size === 0) throw new Error('GitHub contribution page could not be parsed');

  return {
    counts,
    total: parsePublicContributionTotal(html),
  };
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

function createUpstreamActivity(
  counts: Map<string, number>,
  total: number | null,
  source: Exclude<ActivitySource, 'unavailable'>,
  rateLimit: GitHubRateLimit | null,
  now = new Date(),
): UpstreamActivity {
  const summary = summarizeCounts(counts, source, now, total);
  return {
    activity: {
      username: GITHUB_USERNAME,
      source,
      generatedAt: now.toISOString(),
      ...summary,
      repositories: featuredRepositories(),
    },
    rateLimit,
  };
}

async function loadGitHubHomeData(): Promise<UpstreamActivity> {
  const profileToken = process.env.GITHUB_PROFILE_TOKEN?.trim();
  if (profileToken) {
    try {
      const result = await fetchGitHubContributionCalendar(GITHUB_USERNAME, profileToken);
      return createUpstreamActivity(
        result.counts,
        result.total,
        'github-graphql',
        result.rateLimit,
      );
    } catch (error) {
      console.warn('Authenticated GitHub contribution calendar failed; using public profile', error);
    }
  }

  const { counts, total } = await fetchPublicProfileCounts();
  return createUpstreamActivity(counts, total, 'public-profile', null);
}

const getCachedUpstreamActivity = unstable_cache(
  loadGitHubHomeData,
  ['github-homepage-v9'],
  { revalidate: GITHUB_ACTIVITY_UPSTREAM_FRESH_SECONDS },
);

const githubHomeCache = createStaleWhileErrorCache<UpstreamActivity>({
  load: getCachedUpstreamActivity,
  freshForMs: GITHUB_ACTIVITY_INSTANCE_FRESH_MS,
  staleForMs: GITHUB_ACTIVITY_STALE_SECONDS * 1_000,
  retryBaseMs: GITHUB_ACTIVITY_RETRY_BASE_MS,
  retryMaxMs: GITHUB_ACTIVITY_RETRY_MAX_MS,
});

export async function getGitHubHomeResult(): Promise<GitHubHomeResult> {
  const cached = await githubHomeCache.get();
  const activity = cached.value?.activity ?? unavailableHomeData();

  return {
    activity,
    diagnostics: {
      cacheStatus: cached.diagnostics.status,
      upstreamSource: activity.source,
      lastUpstreamAttempt: cached.diagnostics.lastAttemptAt,
      lastUpstreamFetch: cached.value?.activity.generatedAt ?? null,
      consecutiveFailures: cached.diagnostics.consecutiveFailures,
      nextRetryAt: cached.diagnostics.nextRetryAt,
      rateLimit: cached.value?.rateLimit ?? null,
    },
  };
}

export async function getGitHubHomeData(): Promise<GitHubHomeData> {
  return (await getGitHubHomeResult()).activity;
}
