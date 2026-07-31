import { describe, expect, it, vi } from 'vitest';
import {
  fetchGitHubContributionCalendar,
  parseGitHubContributionCalendar,
} from './github-contribution-calendar';

const username = 'teamleaderleo';
const payload = {
  data: {
    user: {
      login: username,
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 18,
          weeks: [
            {
              contributionDays: [
                { date: '2026-07-27', contributionCount: 7 },
                { date: '2026-07-28', contributionCount: 11 },
              ],
            },
          ],
        },
      },
    },
  },
};

function calendar(overrides: Record<string, unknown>, login = username) {
  return {
    data: {
      user: {
        login,
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: 1,
            weeks: [
              {
                contributionDays: [{ date: '2026-07-28', contributionCount: 1 }],
              },
            ],
            ...overrides,
          },
        },
      },
    },
  };
}

describe('parseGitHubContributionCalendar', () => {
  it('reads official per-day counts and the calendar total', () => {
    const result = parseGitHubContributionCalendar(payload, username);

    expect([...result.counts.entries()]).toEqual([
      ['2026-07-27', 7],
      ['2026-07-28', 11],
    ]);
    expect(result.total).toBe(18);
    expect(result.rateLimit).toBeNull();
  });

  it('rejects missing, cross-user, and malformed calendars instead of publishing zeroes', () => {
    expect(() =>
      parseGitHubContributionCalendar({ data: { user: null } }, username),
    ).toThrow('user did not match the request');
    expect(() =>
      parseGitHubContributionCalendar(calendar({}, 'somebody-else'), username),
    ).toThrow('user did not match the request');
    expect(() =>
      parseGitHubContributionCalendar(calendar({
        weeks: [{ contributionDays: [{ date: 'July 28', contributionCount: 1 }] }],
      }), username),
    ).toThrow('contribution day was invalid');
  });

  it('rejects impossible dates, duplicate dates, and contradictory totals', () => {
    expect(() =>
      parseGitHubContributionCalendar(calendar({
        weeks: [{ contributionDays: [{ date: '2026-02-30', contributionCount: 1 }] }],
      }), username),
    ).toThrow('contribution day was invalid');

    expect(() =>
      parseGitHubContributionCalendar(calendar({
        totalContributions: 2,
        weeks: [
          { contributionDays: [{ date: '2026-07-28', contributionCount: 1 }] },
          { contributionDays: [{ date: '2026-07-28', contributionCount: 1 }] },
        ],
      }), username),
    ).toThrow('duplicate dates');

    expect(() =>
      parseGitHubContributionCalendar(
        calendar({ totalContributions: 2 }),
        username,
      ),
    ).toThrow('total was inconsistent');
  });

  it('does not echo upstream GraphQL error text', () => {
    const hostile = {
      errors: [{ message: 'token ghp_should_never_reach_logs' }],
    };
    expect(() => parseGitHubContributionCalendar(hostile, username)).toThrow(
      'contribution query returned errors',
    );
    expect(() => parseGitHubContributionCalendar(hostile, username)).not.toThrow(
      'ghp_should_never_reach_logs',
    );
  });
});

describe('fetchGitHubContributionCalendar', () => {
  it('uses GitHub GraphQL with bearer authentication and the requested login', async () => {
    const fetchImpl = vi.fn(async (..._args: Parameters<typeof fetch>) =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '5000',
          'X-RateLimit-Remaining': '4998',
          'X-RateLimit-Used': '2',
          'X-RateLimit-Reset': '1785258000',
          'X-RateLimit-Resource': 'graphql',
        },
      }),
    );

    const result = await fetchGitHubContributionCalendar(
      'TeamLeaderLeo',
      'profile-token',
      fetchImpl,
    );

    expect(result.total).toBe(18);
    expect(result.rateLimit).toEqual({
      limit: 5000,
      remaining: 4998,
      used: 2,
      resetAt: '2026-07-28T17:00:00.000Z',
      resource: 'graphql',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.github.com/graphql');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer profile-token');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      variables: { login: username },
    });
  });

  it('rejects oversized success responses before parsing', async () => {
    const oversized = `{"padding":"${'x'.repeat(256 * 1024)}"}`;
    await expect(fetchGitHubContributionCalendar(
      username,
      'profile-token',
      vi.fn(async () => new Response(oversized, { status: 200 })),
    )).rejects.toThrow('response was too large');
  });

  it('replaces network failures and provider bodies with stable local errors', async () => {
    await expect(fetchGitHubContributionCalendar(
      username,
      'profile-token',
      vi.fn(async () => {
        throw new Error('request leaked profile-token');
      }),
    )).rejects.toThrow('contribution request failed');

    await expect(fetchGitHubContributionCalendar(
      username,
      'profile-token',
      vi.fn(async () => new Response(
        JSON.stringify({ message: 'profile-token rejected' }),
        { status: 401 },
      )),
    )).rejects.toThrow('contribution request returned 401');
  });
});
