import { describe, expect, it } from 'vitest';
import { createGitHubActivityHeaders } from './github-activity-response';
import type { GitHubHomeResult } from './github-home';

function result(source: GitHubHomeResult['activity']['source']): GitHubHomeResult {
  return {
    activity: {
      username: 'teamleaderleo',
      source,
      generatedAt: '2026-07-27T01:00:00.000Z',
      total: 18,
      periodLabel: source === 'public-profile' ? 'this year' : 'last 35 days',
      today: 3,
      weekTotal: 9,
      activeDays: 5,
      currentStreak: 2,
      days: [],
      repositories: [],
    },
    diagnostics: {
      cacheStatus: 'stale',
      upstreamSource: source,
      lastUpstreamAttempt: '2026-07-27T01:05:00.000Z',
      lastUpstreamFetch: '2026-07-27T01:00:00.000Z',
      consecutiveFailures: 2,
      nextRetryAt: '2026-07-27T01:07:00.000Z',
      rateLimit: {
        limit: 60,
        remaining: 41,
        used: 19,
        resetAt: '2026-07-27T02:00:00.000Z',
        resource: 'core',
      },
    },
  };
}

describe('createGitHubActivityHeaders', () => {
  it('exposes freshness, retry, and REST rate-limit diagnostics', () => {
    const headers = createGitHubActivityHeaders(result('public-events'), 'request-123');

    expect(headers.get('cache-control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=3600',
    );
    expect(headers.get('x-activity-cache')).toBe('stale');
    expect(headers.get('x-activity-source')).toBe('public-events');
    expect(headers.get('x-activity-generated-at')).toBe('2026-07-27T01:00:00.000Z');
    expect(headers.get('x-activity-last-attempt')).toBe('2026-07-27T01:05:00.000Z');
    expect(headers.get('x-activity-last-upstream-fetch')).toBe('2026-07-27T01:00:00.000Z');
    expect(headers.get('x-activity-next-retry-at')).toBe('2026-07-27T01:07:00.000Z');
    expect(headers.get('x-activity-failures')).toBe('2');
    expect(headers.get('x-activity-ratelimit-limit')).toBe('60');
    expect(headers.get('x-activity-ratelimit-remaining')).toBe('41');
    expect(headers.get('x-activity-ratelimit-used')).toBe('19');
    expect(headers.get('x-activity-ratelimit-reset')).toBe('2026-07-27T02:00:00.000Z');
    expect(headers.get('x-activity-ratelimit-resource')).toBe('core');
    expect(headers.get('x-request-id')).toBe('request-123');
  });

  it('does not label an unavailable placeholder as generated activity', () => {
    const headers = createGitHubActivityHeaders(result('unavailable'), 'request-456');

    expect(headers.get('x-activity-source')).toBe('unavailable');
    expect(headers.has('x-activity-generated-at')).toBe(false);
  });
});
