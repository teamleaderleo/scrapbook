import { unstable_cache } from 'next/cache';
import { captureCacheLoad, unwrapCacheLoad } from './cache-load-result';
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
    name: 'preflight',
    url: 'https://github.com/teamleaderleo/preflight',
    note: 'Cross-platform performance launcher and mod analysis for Starsector.',
  },
  {
    name: 'stensibly',
    url: 'https://github.com/teamleaderleo/stensibly',
    note: 'Work and handoffs that survive disposable agent sessions.',
  },
  {
    name: 'Glaeda',
    url: 'https://github.com/teamleaderleo/smolrunner',
    note: 'Trust-tiered Linux execution; hot project state when trust permits.',
  },
  {
    name: 'cultist',
    url: 'https://github.com/teamleaderleo/cultist',
    note: 'Repository evidence before code changes: find out why before you copy it.',
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

type GitHubHomeCommon = {
  username: string;
  generatedAt: string;
  repositories: Array<{
    name: string;
    url: string;
    note: string;
  }>;
};

type GitHubAvailableHomeData = GitHubHomeCommon & {
  source: 'github-graphql' | 'public-profile';
  total: number | null;
  periodLabel: 'last year';
  today: number;
  weekTotal: number;
  activeDays: number;
  currentStreak: number;
  days: ContributionDay[];
};

type GitHubUnavailableHomeData = GitHubHomeCommon & {
  source: 'unavailable';
  total: null;
  periodLabel: 'last 35 days';
  today: null;
  weekTotal: null;
  activeDays: null;
  currentStreak: null;
  days: [];
};

export type GitHubHomeData = GitHubAvailableHomeData | GitHubUnavailableHomeData;

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
  GitHubAvailableHomeData,
  'total' | 'periodLabel' | 'today' | 'weekTotal' | 'activeDays' | 'currentStreak' | 'days'
>;
type UpstreamActivity = {
  activity: GitHubAvailableHomeData;
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
  now = new Date(),
  reportedTotal: number | null = null,
): ActivitySummary {
  const days = daysFromCounts(counts, now);
  const today = dateKeyInTimeZone(now);
  const periodEntries = [...counts.entries()].filter(([date]) => date <= today);
  const streakDays = daysFromCounts(counts, now, 366);
  const calculatedTotal = periodEntries.reduce((sum, [, count]) => sum + count, 0);

  return {
    total: reportedTotal ?? calculatedTotal,
    periodLabel: 'last year',
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

export function createUnavailableGitHubHomeData(now = new Date()): GitHubUnavailableHomeData {
  return {
    username: GITHUB_USERNAME,
    source: 'unavailable',
    generatedAt: now.toISOString(),
    total: null,
    periodLabel: 'last 35 days',
    today: null,
    weekTotal: null,
    activeDays: null,
    currentStreak: null,
    days: [],
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
  const summary = summarizeCounts(counts, now, total);
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
  () => captureCacheLoad(loadGitHubHomeData),
  ['github-homepage-v13'],
  { revalidate: GITHUB_ACTIVITY_UPSTREAM_FRESH_SECONDS },
);

async function loadCachedUpstreamActivity(): Promise<UpstreamActivity> {
  return unwrapCacheLoad(await getCachedUpstreamActivity());
}

const githubHomeCache = createStaleWhileErrorCache<UpstreamActivity>({
  load: loadCachedUpstreamActivity,
  freshForMs: GITHUB_ACTIVITY_INSTANCE_FRESH_MS,
  staleForMs: GITHUB_ACTIVITY_STALE_SECONDS * 1_000,
  retryBaseMs: GITHUB_ACTIVITY_RETRY_BASE_MS,
  retryMaxMs: GITHUB_ACTIVITY_RETRY_MAX_MS,
});

export async function getGitHubHomeResult(): Promise<GitHubHomeResult> {
  const cached = await githubHomeCache.get();
  const activity = cached.value?.activity ?? createUnavailableGitHubHomeData();

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
