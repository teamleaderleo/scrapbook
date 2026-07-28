const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const GITHUB_API_VERSION = '2022-11-28';
const UPSTREAM_TIMEOUT_MS = 8_000;

const CONTRIBUTION_CALENDAR_QUERY = `
  query ContributionCalendar($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

export type GitHubGraphqlRateLimit = {
  limit: number | null;
  remaining: number | null;
  used: number | null;
  resetAt: string | null;
  resource: string | null;
};

export type GitHubContributionCalendarResult = {
  counts: Map<string, number>;
  total: number;
  rateLimit: GitHubGraphqlRateLimit | null;
};

type FetchLike = typeof fetch;

type GraphqlPayload = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions?: unknown;
          weeks?: unknown;
        };
      };
    } | null;
  };
  errors?: Array<{ message?: unknown }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function headerInteger(headers: Headers, name: string): number | null {
  const value = headers.get(name);
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRateLimitHeaders(headers: Headers): GitHubGraphqlRateLimit | null {
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

export function parseGitHubContributionCalendar(
  payload: unknown,
): GitHubContributionCalendarResult {
  if (!isRecord(payload)) throw new Error('GitHub GraphQL returned an invalid payload');

  const typedPayload = payload as GraphqlPayload;
  if (typedPayload.errors?.length) {
    const message = typedPayload.errors
      .map((error) => (typeof error.message === 'string' ? error.message : 'GraphQL error'))
      .join('; ');
    throw new Error(`GitHub GraphQL contribution query failed: ${message}`);
  }

  const calendar = typedPayload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar || !Number.isInteger(calendar.totalContributions) || !Array.isArray(calendar.weeks)) {
    throw new Error('GitHub GraphQL contribution calendar was missing');
  }

  const counts = new Map<string, number>();
  for (const week of calendar.weeks) {
    if (!isRecord(week) || !Array.isArray(week.contributionDays)) {
      throw new Error('GitHub GraphQL contribution week was invalid');
    }
    for (const day of week.contributionDays) {
      if (
        !isRecord(day) ||
        typeof day.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
        !Number.isInteger(day.contributionCount) ||
        (day.contributionCount as number) < 0
      ) {
        throw new Error('GitHub GraphQL contribution day was invalid');
      }
      counts.set(day.date, day.contributionCount as number);
    }
  }

  if (counts.size === 0) throw new Error('GitHub GraphQL contribution calendar was empty');

  return {
    counts,
    total: calendar.totalContributions as number,
    rateLimit: null,
  };
}

export async function fetchGitHubContributionCalendar(
  username: string,
  token: string,
  fetchImpl: FetchLike = fetch,
): Promise<GitHubContributionCalendarResult> {
  const response = await fetchImpl(GITHUB_GRAPHQL_ENDPOINT, {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'teamleaderleo-scrapbook',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
    body: JSON.stringify({ query: CONTRIBUTION_CALENDAR_QUERY, variables: { login: username } }),
  });

  if (!response.ok) throw new Error(`GitHub GraphQL returned ${response.status}`);
  const parsed = parseGitHubContributionCalendar(await response.json());
  return { ...parsed, rateLimit: parseRateLimitHeaders(response.headers) };
}
