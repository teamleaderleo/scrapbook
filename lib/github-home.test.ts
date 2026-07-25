import { describe, expect, it } from 'vitest';
import { getRecentDateKeys, parsePublicContributionHtml } from './github-home';

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

describe('getRecentDateKeys', () => {
  it('uses Pacific calendar dates before local midnight', () => {
    const days = getRecentDateKeys(new Date('2026-07-25T06:30:00Z'));
    expect(days.at(-1)).toBe('2026-07-24');
    expect(days).toHaveLength(7);
  });

  it('rolls over at Pacific midnight', () => {
    const days = getRecentDateKeys(new Date('2026-07-25T07:30:00Z'));
    expect(days.at(-1)).toBe('2026-07-25');
  });
});
