import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { healthyMachineReport } from '@/tests/fixtures/machine-health';

const saveMachineHealth = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/machine-health-store', async importOriginal => {
  const original =
    await importOriginal<typeof import('@/app/lib/machine-health-store')>();
  return { ...original, saveMachineHealth };
});

import { POST } from './route';

function request(body: string, token = 'test-secret') {
  return new NextRequest('http://localhost/api/machine-health/ingest', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body,
  });
}

describe('machine health ingestion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T06:05:00.000Z'));
    vi.stubEnv('MACHINE_HEALTH_INGEST_SECRET', 'test-secret');
    saveMachineHealth.mockResolvedValue({
      host: 'big-red',
      checkedAt: healthyMachineReport.checked_at,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('rejects bad credentials before storing anything', async () => {
    const response = await POST(request('{}', 'wrong-secret'));
    expect(response.status).toBe(401);
    expect(saveMachineHealth).not.toHaveBeenCalled();
  });

  it('rejects malformed and oversized reports', async () => {
    expect((await POST(request('{'))).status).toBe(400);
    expect(
      (await POST(request(JSON.stringify({ junk: 'x'.repeat(17 * 1_024) }))))
        .status
    ).toBe(413);
    expect(saveMachineHealth).not.toHaveBeenCalled();
  });

  it('stores the allowlisted report and strips unknown nested keys', async () => {
    const response = await POST(
      request(
        JSON.stringify({
          ...healthyMachineReport,
          secret: 'discard-me',
          network: {
            ...healthyMachineReport.network,
            peer_names: ['discard-me'],
          },
        })
      )
    );
    expect(response.status).toBe(200);
    expect(saveMachineHealth).toHaveBeenCalledWith(healthyMachineReport);
  });

  it('rejects stale or implausibly future-dated reports', async () => {
    const stale = await POST(
      request(
        JSON.stringify({
          ...healthyMachineReport,
          checked_at: '2026-08-27T05:00:00.000Z',
        })
      )
    );
    const future = await POST(
      request(
        JSON.stringify({
          ...healthyMachineReport,
          checked_at: '2026-08-29T06:16:00.000Z',
        })
      )
    );

    expect(stale.status).toBe(400);
    expect(future.status).toBe(400);
    expect(saveMachineHealth).not.toHaveBeenCalled();
  });
});
