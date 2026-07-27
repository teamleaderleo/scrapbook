import { describe, expect, it } from 'vitest';

import { normalizeStoredProxyPayload } from './proxy-health-store';

const report = {
  host: 'bandwagon-la',
  checked_at: '2026-07-27T08:44:31.720Z',
  provider: {
    usage: {
      source: 'kiwivm',
      used_bytes: 920_118_925_754,
      limit_bytes: 1_073_741_824_000,
      reset_at: '2026-07-28T12:53:53Z',
    },
  },
};

describe('normalizeStoredProxyPayload', () => {
  it('keeps correctly stored JSONB objects intact', () => {
    expect(normalizeStoredProxyPayload(report)).toEqual(report);
  });

  it('recovers the legacy JSON string stored inside JSONB', () => {
    expect(normalizeStoredProxyPayload(JSON.stringify(report))).toEqual(report);
  });

  it('recovers a second accidental serialization layer', () => {
    expect(normalizeStoredProxyPayload(JSON.stringify(JSON.stringify(report)))).toEqual(report);
  });

  it('rejects invalid strings, arrays, and scalar values', () => {
    expect(normalizeStoredProxyPayload('{not-json')).toEqual({});
    expect(normalizeStoredProxyPayload([])).toEqual({});
    expect(normalizeStoredProxyPayload(42)).toEqual({});
  });
});
