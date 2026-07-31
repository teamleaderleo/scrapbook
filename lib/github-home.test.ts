import { describe, expect, it } from 'vitest';
import {
  alignContributionDaysToWeekColumns,
  getRecentDateKeys,
  parsePublicContributionHtml,
  parsePublicContributionTotal,
} from './github-activity-utils';
import { createUnavailableGitHubHomeData, parseGitHubRateLimit } from './github-home';

describe('parsePublicContributionHtml', () => {
  it('reads direct data-count attributes', () => {
    const counts = parsePublicContributionHtml(
      '<td data-date="2026-07-24" data-count="12"></td>',
    );

    expect(counts.get('2026-07-24')).toBe(12);
  });

  it('reads tooltip counts, including commas and zero contributions', () => {
    const html = `
      <tool-tip for="cell-a">1,234 contributions on July 23</tool-tip>
      <tool-tip for="cell-b">No contributions on July 24</tool-tip>
      <td id="cell-a" data-date="2026-07-23"></td>
      <td id="cell-b" data-date="2026-07-24"></td>
    `;

    const counts = parsePublicContributionHtml(html);
    expect(counts.get('2026-07-23')).toBe(1234);
    expect(counts.get('2026-07-24')).toBe(0);
  });

  it('returns an empty map when GitHub markup is not recognized', () => {
    expect(parsePublicContributionHtml('<main>changed markup</main>').size).toBe(0);
  });
});

describe('parsePublicContributionTotal', () => {
  it('reads the rolling-year total reported by the profile calendar', () => {
    expect(
      parsePublicContributionTotal(
        '<h2 class="f4 text-normal mb-2">1,234 contributions in the last year</h2>',
      ),
    ).toBe(1234);
  });

  it('returns null when the profile total is absent', () => {
    expect(parsePublicContributionTotal('<main>Contribution calendar</main>')).toBeNull();
  });
});

describe('getRecentDateKeys', () => {
  it('uses the GitHub UTC contribution date', () => {
    const days = getRecentDateKeys(new Date('2026-07-25T06:30:00Z'));
    expect(days.at(-1)).toBe('2026-07-25');
    expect(days).toHaveLength(7);
  });

  it('rolls over at UTC midnight', () => {
    expect(getRecentDateKeys(new Date('2026-07-24T23:59:59Z')).at(-1)).toBe('2026-07-24');
    expect(getRecentDateKeys(new Date('2026-07-25T00:00:01Z')).at(-1)).toBe('2026-07-25');
  });

  it('supports the 35-day homepage window', () => {
    const days = getRecentDateKeys(new Date('2026-07-25T07:30:00Z'), 35);
    expect(days).toHaveLength(35);
    expect(days[0]).toBe('2026-06-21');
    expect(days.at(-1)).toBe('2026-07-25');
  });
});

describe('alignContributionDaysToWeekColumns', () => {
  it('pads the first and last weeks so columns run Sunday through Saturday', () => {
    const days = [
      { date: '2026-07-22', count: 1 },
      { date: '2026-07-23', count: 2 },
      { date: '2026-07-24', count: 3 },
      { date: '2026-07-25', count: 4 },
      { date: '2026-07-26', count: 5 },
    ];

    const cells = alignContributionDaysToWeekColumns(days);
    expect(cells).toHaveLength(14);
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]).toEqual(days[0]);
    expect(cells[6]).toEqual(days[3]);
    expect(cells[7]).toEqual(days[4]);
    expect(cells.slice(8)).toEqual([null, null, null, null, null, null]);
  });
});

describe('unavailable GitHub activity', () => {
  it('carries no numeric summaries or synthetic contribution days', () => {
    expect(createUnavailableGitHubHomeData(new Date('2026-07-31T00:00:00Z'))).toMatchObject({
      source: 'unavailable',
      generatedAt: '2026-07-31T00:00:00.000Z',
      total: null,
      today: null,
      weekTotal: null,
      activeDays: null,
      currentStreak: null,
      days: [],
    });
  });
});

describe('parseGitHubRateLimit', () => {
  it('captures REST fallback limit headers', () => {
    const headers = new Headers({
      'x-ratelimit-limit': '60',
      'x-ratelimit-remaining': '41',
      'x-ratelimit-used': '19',
      'x-ratelimit-reset': '1785114000',
      'x-ratelimit-resource': 'core',
    });

    expect(parseGitHubRateLimit(headers)).toEqual({
      limit: 60,
      remaining: 41,
      used: 19,
      resetAt: '2026-07-27T01:00:00.000Z',
      resource: 'core',
    });
  });

  it('returns null when GitHub did not send limit headers', () => {
    expect(parseGitHubRateLimit(new Headers())).toBeNull();
  });
});
