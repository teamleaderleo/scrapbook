import { describe, expect, it, vi } from 'vitest';

import { readWorkerOutcomeSnapshot } from './worker-outcome-source';

const NOW = new Date('2026-09-05T07:00:00.000Z');

function jsonResponse(payload: unknown, ok = true) {
  return {
    ok,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => payload,
  };
}

function stubFetch(
  handler: (url: string) => unknown | null
): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    const payload = handler(url);
    if (payload === null)
      return {
        ok: false,
        headers: new Headers(),
        json: async () => null,
      };
    return jsonResponse(payload);
  }) as typeof fetch;
}

const openPulls = [
  {
    number: 817,
    title: 'Add provider-labelled usage lane',
    draft: false,
    updated_at: '2026-09-05T06:00:00Z',
    html_url: 'https://github.com/teamleaderleo/scrapbook/pull/817',
    head: { sha: 'abc123' },
  },
  {
    number: 800,
    title: 'Add accepted-work economics',
    draft: false,
    updated_at: '2026-09-05T05:00:00Z',
    html_url: 'https://github.com/teamleaderleo/scrapbook/pull/800',
    head: { sha: 'def456' },
  },
];

describe('readWorkerOutcomeSnapshot', () => {
  it('projects synthetic pull, review, and check state into attention buckets', async () => {
    const fetchImpl = stubFetch(url => {
      if (url.includes('/pulls?state=open')) return openPulls;
      if (url.includes('/pulls/817/reviews'))
        return [{ state: 'CHANGES_REQUESTED', submitted_at: '2026-09-05T06:30:00Z' }];
      if (url.includes('/pulls/800/reviews'))
        return [{ state: 'COMMENTED', submitted_at: null }];
      if (url.includes('/commits/abc123/check-runs'))
        return { check_runs: [{ status: 'completed', conclusion: 'success' }] };
      if (url.includes('/commits/def456/check-runs'))
        return { check_runs: [{ status: 'completed', conclusion: 'failure' }] };
      return null;
    });
    const snapshot = await readWorkerOutcomeSnapshot(fetchImpl, NOW);
    expect(snapshot.status).toBe('ready');
    if (snapshot.status !== 'ready') throw new Error('expected ready');
    const buckets = new Map(
      snapshot.attention.items.map(item => [item.assignment_id, item.bucket])
    );
    expect(buckets.get('pr-817')).toBe('needs-decision');
    expect(buckets.get('pr-800')).toBe('needs-decision');
    expect(snapshot.attention.items[0]?.artifact_url).toContain(
      'https://github.com/teamleaderleo/scrapbook/pull/'
    );
  });

  it('marks review and check state unknown when detail reads fail', async () => {
    const fetchImpl = stubFetch(url => {
      if (url.includes('/pulls?state=open')) return openPulls;
      return null;
    });
    const snapshot = await readWorkerOutcomeSnapshot(fetchImpl, NOW);
    expect(snapshot.status).toBe('ready');
    if (snapshot.status !== 'ready') throw new Error('expected ready');
    expect(snapshot.attention.items[0]?.bucket).toBe('unknown');
    expect(snapshot.attention.items[0]?.reasons).toEqual([
      'review and check state unavailable',
    ]);
  });

  it('fails closed to unavailable when the assignment transport is absent', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    const snapshot = await readWorkerOutcomeSnapshot(fetchImpl, NOW);
    expect(snapshot).toMatchObject({
      status: 'unavailable',
      reason: 'assignment transport unreachable',
    });
  });

  it('fails closed when the payload shape is unrecognized', async () => {
    const fetchImpl = stubFetch(() => ({ unexpected: true }));
    const snapshot = await readWorkerOutcomeSnapshot(fetchImpl, NOW);
    expect(snapshot.status).toBe('unavailable');
  });
});
