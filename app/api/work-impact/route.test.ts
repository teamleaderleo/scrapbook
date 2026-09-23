import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/work-impact', () => {
  it('returns the compact curated impact ledger', async () => {
    const response = GET(new Request('https://example.test/api/work-impact'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(body).toMatchObject({
      version: 1,
      source: 'repository',
    });
    expect(body.totalRecordCount).toBeGreaterThanOrEqual(8);
    expect(body.recordCount).toBe(body.totalRecordCount);
    expect(body.summary.recordCount).toBe(body.totalRecordCount);
    expect(body.summary.claimCount).toBeGreaterThanOrEqual(7);
    expect(body.summary.accountingRule).toContain('explicitly marked additive');
    expect(
      body.records.some((record: { id: string }) => record.id === 'swift-92545')
    ).toBe(true);
  });

  it('filters without consulting GitHub', async () => {
    const response = GET(
      new Request(
        'https://example.test/api/work-impact?repo=manaflow-ai%2Fcmux&dimension=reliability'
      )
    );
    const body = await response.json();

    expect(body.recordCount).toBeGreaterThanOrEqual(2);
    expect(
      body.records.map((record: { id: string }) => record.id)
    ).toEqual(expect.arrayContaining(['cmux-13962', 'cmux-13935']));
    expect(
      body.records.every(
        (record: { repository: string; claims: Array<{ dimension: string }> }) =>
          record.repository === 'manaflow-ai/cmux' &&
          record.claims.some(claim => claim.dimension === 'reliability')
      )
    ).toBe(true);
  });

  it('supports free-text lookup across claims and areas', async () => {
    const response = GET(
      new Request('https://example.test/api/work-impact?q=compilation%20cache')
    );
    const body = await response.json();

    expect(body.records.map((record: { id: string }) => record.id)).toEqual(
      expect.arrayContaining(['cmux-13060', 'cmux-13754'])
    );
  });
});
