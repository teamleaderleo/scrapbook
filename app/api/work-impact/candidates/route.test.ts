import { describe, expect, it } from 'vitest';
import { REPOSITORY_PUBLIC_CACHE_CONTROL } from '@/lib/repository-public-cache';
import { GET } from './route';

describe('GET /api/work-impact/candidates', () => {
  it('queries the checked-in pull-request snapshot without GitHub', async () => {
    const response = GET(
      new Request('https://example.test/api/work-impact/candidates?q=latency')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(
      REPOSITORY_PUBLIC_CACHE_CONTROL
    );
    expect(body).toMatchObject({
      version: 1,
      source: 'repository-snapshot',
    });
    expect(body.totalRecordCount).toBeGreaterThanOrEqual(437);
    expect(body.recordCount).toBeGreaterThan(0);
    expect(
      body.records.every(
        (record: { repository: string }) =>
          record.repository === 'manaflow-ai/cmux'
      )
    ).toBe(true);
  });

  it('bounds result count and exposes only compact candidate evidence', async () => {
    const response = GET(
      new Request(
        'https://example.test/api/work-impact/candidates?repo=manaflow-ai%2Fcmux&limit=3'
      )
    );
    const body = await response.json();

    expect(body.recordCount).toBe(3);
    expect(body.records).toHaveLength(3);
    expect(body.records[0]).toMatchObject({
      repository: 'manaflow-ai/cmux',
      metricHints: expect.any(Array),
    });
    expect(body.records[0]).not.toHaveProperty('body');
  });
});
