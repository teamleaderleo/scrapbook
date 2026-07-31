const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const GITHUB_API_VERSION = '2022-11-28';
const UPSTREAM_TIMEOUT_MS = 8_000;
const MAXIMUM_RESPONSE_BYTES = 256 * 1024;
const MAXIMUM_CALENDAR_WEEKS = 54;
const MAXIMUM_DAYS_PER_WEEK = 7;
const MAXIMUM_CONTRIBUTION_COUNT = 1_000_000;
const MAXIMUM_TOTAL_CONTRIBUTIONS = 10_000_000;
const MAXIMUM_RATE_LIMIT_RESET_SECONDS = 8_640_000_000_000;

const CONTRIBUTION_CALENDAR_QUERY = `
  query ContributionCalendar($login: String!) {
    user(login: $login) {
      login
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
      login?: unknown;
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions?: unknown;
          weeks?: unknown;
        };
      };
    } | null;
  };
  errors?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function githubLogin(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('GitHub GraphQL contribution user was invalid');
  }
  const login = value.trim().toLowerCase();
  if (
    !/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(login)
    || login.includes('--')
  ) {
    throw new Error('GitHub GraphQL contribution user was invalid');
  }
  return login;
}

function headerInteger(headers: Headers, name: string): number | null {
  const value = headers.get(name);
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function resetTimestamp(value: number | null): string | null {
  if (value === null || value > MAXIMUM_RATE_LIMIT_RESET_SECONDS) return null;
  const date = new Date(value * 1_000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseRateLimitHeaders(headers: Headers): GitHubGraphqlRateLimit | null {
  const limit = headerInteger(headers, 'x-ratelimit-limit');
  const remaining = headerInteger(headers, 'x-ratelimit-remaining');
  const used = headerInteger(headers, 'x-ratelimit-used');
  const reset = headerInteger(headers, 'x-ratelimit-reset');
  const resource = headers.get('x-ratelimit-resource');
  const boundedResource = resource && /^[a-z0-9_-]{1,32}$/i.test(resource) ? resource : null;
  const resetAt = resetTimestamp(reset);

  if (
    limit === null
    && remaining === null
    && used === null
    && resetAt === null
    && boundedResource === null
  ) {
    return null;
  }

  return {
    limit,
    remaining,
    used,
    resetAt,
    resource: boundedResource,
  };
}

function canonicalDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('GitHub GraphQL contribution day was invalid');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('GitHub GraphQL contribution day was invalid');
  }
  return value;
}

function boundedCount(value: unknown): number {
  if (
    !Number.isSafeInteger(value)
    || (value as number) < 0
    || (value as number) > MAXIMUM_CONTRIBUTION_COUNT
  ) {
    throw new Error('GitHub GraphQL contribution day was invalid');
  }
  return value as number;
}

export function parseGitHubContributionCalendar(
  payload: unknown,
  expectedUsername: string,
): GitHubContributionCalendarResult {
  if (!isRecord(payload)) throw new Error('GitHub GraphQL returned an invalid payload');

  const typedPayload = payload as GraphqlPayload;
  if (
    typedPayload.errors !== undefined
    && (!Array.isArray(typedPayload.errors) || typedPayload.errors.length > 0)
  ) {
    throw new Error('GitHub GraphQL contribution query returned errors');
  }

  const user = typedPayload.data?.user;
  if (!user || githubLogin(user.login) !== githubLogin(expectedUsername)) {
    throw new Error('GitHub GraphQL contribution user did not match the request');
  }
  const calendar = user.contributionsCollection?.contributionCalendar;
  if (
    !calendar
    || !Number.isSafeInteger(calendar.totalContributions)
    || (calendar.totalContributions as number) < 0
    || (calendar.totalContributions as number) > MAXIMUM_TOTAL_CONTRIBUTIONS
    || !Array.isArray(calendar.weeks)
    || calendar.weeks.length < 1
    || calendar.weeks.length > MAXIMUM_CALENDAR_WEEKS
  ) {
    throw new Error('GitHub GraphQL contribution calendar was missing');
  }

  const counts = new Map<string, number>();
  let calculatedTotal = 0;
  for (const week of calendar.weeks) {
    if (
      !isRecord(week)
      || !Array.isArray(week.contributionDays)
      || week.contributionDays.length < 1
      || week.contributionDays.length > MAXIMUM_DAYS_PER_WEEK
    ) {
      throw new Error('GitHub GraphQL contribution week was invalid');
    }
    for (const day of week.contributionDays) {
      if (!isRecord(day)) {
        throw new Error('GitHub GraphQL contribution day was invalid');
      }
      const date = canonicalDate(day.date);
      const count = boundedCount(day.contributionCount);
      if (counts.has(date)) {
        throw new Error('GitHub GraphQL contribution calendar contained duplicate dates');
      }
      counts.set(date, count);
      calculatedTotal += count;
      if (calculatedTotal > MAXIMUM_TOTAL_CONTRIBUTIONS) {
        throw new Error('GitHub GraphQL contribution calendar total was invalid');
      }
    }
  }

  if (counts.size === 0) throw new Error('GitHub GraphQL contribution calendar was empty');
  if (calculatedTotal !== calendar.totalContributions) {
    throw new Error('GitHub GraphQL contribution calendar total was inconsistent');
  }

  return {
    counts,
    total: calendar.totalContributions as number,
    rateLimit: null,
  };
}

async function readBoundedJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > MAXIMUM_RESPONSE_BYTES) {
    throw new Error('GitHub GraphQL contribution response was too large');
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('GitHub GraphQL contribution response was not valid JSON');
  }
}

export async function fetchGitHubContributionCalendar(
  username: string,
  token: string,
  fetchImpl: FetchLike = fetch,
): Promise<GitHubContributionCalendarResult> {
  const expectedUsername = githubLogin(username);
  let response: Response;
  try {
    response = await fetchImpl(GITHUB_GRAPHQL_ENDPOINT, {
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
      body: JSON.stringify({
        query: CONTRIBUTION_CALENDAR_QUERY,
        variables: { login: expectedUsername },
      }),
    });
  } catch {
    throw new Error('GitHub GraphQL contribution request failed');
  }

  if (!response.ok) {
    throw new Error(`GitHub GraphQL contribution request returned ${response.status}`);
  }
  const parsed = parseGitHubContributionCalendar(
    await readBoundedJson(response),
    expectedUsername,
  );
  return { ...parsed, rateLimit: parseRateLimitHeaders(response.headers) };
}
