import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const saveProxyHealth = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/proxy-health-store', async importOriginal => {
  const original =
    await importOriginal<typeof import('@/app/lib/proxy-health-store')>();
  return { ...original, saveProxyHealth };
});

import { POST } from './route';

function request(body: string, token = 'test-secret') {
  return new NextRequest('http://localhost/api/proxy-health/ingest', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body,
  });
}

describe('proxy health ingestion', () => {
  beforeEach(() => {
    vi.stubEnv('PROXY_HEALTH_INGEST_SECRET', 'test-secret');
    saveProxyHealth.mockResolvedValue({
      host: 'bandwagon-la',
      checkedAt: '2026-08-09T00:00:00.000Z',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('rejects invalid credentials before reading the report', async () => {
    const response = await POST(request('{}', 'wrong-secret'));

    expect(response.status).toBe(401);
    expect(saveProxyHealth).not.toHaveBeenCalled();
  });

  it('rejects malformed and oversized reports', async () => {
    const malformed = await POST(request('{'));
    const oversized = await POST(
      request(JSON.stringify({ errors: ['x'.repeat(65 * 1_024)] }))
    );

    expect(malformed.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(saveProxyHealth).not.toHaveBeenCalled();
  });

  it('rejects reports outside the allowlisted schema', async () => {
    const response = await POST(
      request(JSON.stringify({ host: '', checked_at: 'not-a-date' }))
    );

    expect(response.status).toBe(400);
    expect(saveProxyHealth).not.toHaveBeenCalled();
  });

  it('stores a bounded allowlisted report and strips unknown keys', async () => {
    const response = await POST(
      request(
        JSON.stringify({
          host: 'bandwagon-la',
          checked_at: '2026-08-09T00:00:00.000Z',
          mode: 'wireguard',
          unexpected_secret: 'do-not-store',
        })
      )
    );

    expect(response.status).toBe(200);
    expect(saveProxyHealth).toHaveBeenCalledWith({
      host: 'bandwagon-la',
      checked_at: '2026-08-09T00:00:00.000Z',
      mode: 'wireguard',
    });
  });
});
