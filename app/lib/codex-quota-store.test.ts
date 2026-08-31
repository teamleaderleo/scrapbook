import { describe, expect, it } from 'vitest';

import { codexQuotaEnvelopeSchema } from './codex-quota-store';

const sample = {
  observed_at: '2026-08-31T12:00:00Z',
  limit_id: 'codex',
  window_minutes: 10_080,
  used_percent: 51,
  resets_at: '2026-09-06T12:00:00Z',
};

describe('Codex quota report schema', () => {
  it('accepts bounded rate-limit snapshots', () => {
    const parsed = codexQuotaEnvelopeSchema.parse({
      source: 'big-red',
      collected_at: '2026-08-31T12:05:00Z',
      quota_samples: [sample],
    });

    expect(parsed.quota_samples).toEqual([sample]);
  });

  it('accepts older token reporters with no quota samples', () => {
    expect(
      codexQuotaEnvelopeSchema.parse({
        source: 'macbook-air',
        collected_at: '2026-08-31T12:05:00Z',
      }).quota_samples
    ).toBeUndefined();
  });

  it('rejects duplicate sample identities', () => {
    const result = codexQuotaEnvelopeSchema.safeParse({
      source: 'big-red',
      collected_at: '2026-08-31T12:05:00Z',
      quota_samples: [sample, { ...sample, used_percent: 52 }],
    });

    expect(result.success).toBe(false);
  });
});
