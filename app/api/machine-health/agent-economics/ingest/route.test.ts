import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const saveAgentEconomicsReport = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/agent-economics-store', async importOriginal => {
  const original =
    await importOriginal<typeof import('@/app/lib/agent-economics-store')>();
  return { ...original, saveAgentEconomicsReport };
});

import { AgentEconomicsReplayConflict } from '@/app/lib/agent-economics-store';
import { POST } from './route';

const sample = {
  receipt_sha256: `sha256:${'a'.repeat(64)}`,
  usage_sample_id: 'attempt-1',
  observed_at: '2026-09-01T01:00:00Z',
  provider: 'google',
  harness: 'antigravity',
  five_hour_quota_delta_percent: null,
  weekly_quota_delta_percent: null,
  five_hour_resets_at: null,
  weekly_resets_at: null,
  accepted_outcome: 'accepted' as const,
  verification_outcome: 'passed' as const,
  wall_time_ms: 1_000,
  retries: 0,
  operator_intervention_minutes: null,
  cleanup_rework: 'none' as const,
  subscription_monthly_dollars: null,
};
const report = {
  schema: 'agent-task-settlement-report/v1' as const,
  source: 'big-red',
  collected_at: '2026-09-01T01:05:00Z',
  samples: [sample],
};

function request(body: string, token = 'test-secret') {
  return new NextRequest(
    'http://localhost/api/machine-health/agent-economics/ingest',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body,
    }
  );
}

describe('agent economics ingestion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-01T01:05:00Z'));
    vi.stubEnv('MACHINE_HEALTH_INGEST_SECRET', 'test-secret');
    saveAgentEconomicsReport.mockResolvedValue({ samples: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('stores a bounded settlement and rejects private undeclared fields', async () => {
    const response = await POST(request(JSON.stringify(report)));
    expect(response.status).toBe(200);
    expect(saveAgentEconomicsReport).toHaveBeenCalledWith(report);
    expect(
      (
        await POST(
          request(JSON.stringify({ ...report, prompt: 'must-not-survive' }))
        )
      ).status
    ).toBe(400);
  });

  it('rejects bad credentials and acceptance without verification', async () => {
    expect((await POST(request('{}', 'wrong'))).status).toBe(401);
    expect(
      (
        await POST(
          request(
            JSON.stringify({
              ...report,
              samples: [{ ...sample, verification_outcome: 'failed' }],
            })
          )
        )
      ).status
    ).toBe(400);
    expect(saveAgentEconomicsReport).not.toHaveBeenCalled();
  });

  it('rejects future and over-age samples', async () => {
    const invalidTimes = ['2026-09-01T02:00:00Z', '2026-05-01T01:00:00Z'];
    for (const observed_at of invalidTimes) {
      const response = await POST(
        request(
          JSON.stringify({
            ...report,
            samples: [{ ...sample, observed_at }],
          })
        )
      );
      expect(response.status).toBe(400);
    }
    expect(saveAgentEconomicsReport).not.toHaveBeenCalled();
  });

  it('returns 409 when a receipt digest is replayed with changed facts', async () => {
    saveAgentEconomicsReport.mockRejectedValueOnce(
      new AgentEconomicsReplayConflict('changed settlement replay')
    );

    const response = await POST(request(JSON.stringify(report)));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'changed settlement replay',
    });
  });
});
