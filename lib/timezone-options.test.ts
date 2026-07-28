import { describe, expect, it } from 'vitest';

import { TIMEZONE_OPTIONS, getTimezoneSearchTerms } from './timezone-options';

function option(id: string) {
  const value = TIMEZONE_OPTIONS.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`Missing timezone option: ${id}`);
  return value;
}

describe('getTimezoneSearchTerms', () => {
  it('maps common North American cities to their regional time zones', () => {
    expect(getTimezoneSearchTerms(option('eastern'))).toContain('New York');
    expect(getTimezoneSearchTerms(option('pacific'))).toContain('Los Angeles');
    expect(getTimezoneSearchTerms(option('central'))).toContain('Chicago');
    expect(getTimezoneSearchTerms(option('mountain'))).toContain('Denver');
  });

  it('includes IANA and seasonal abbreviation aliases', () => {
    expect(getTimezoneSearchTerms(option('london'))).toEqual(
      expect.arrayContaining(['Europe/London', 'GMT', 'BST']),
    );
    expect(getTimezoneSearchTerms(option('sydney'))).toEqual(
      expect.arrayContaining(['Australia/Sydney', 'AEST', 'AEDT']),
    );
  });
});
