import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const saveAgentTelemetryReport = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/agent-usage-store', async importOriginal => {
  const original =
    await importOriginal<typeof import('@/app/lib/agent-usage-store')>();
  return { ...original, saveAgentTelemetryReport };
});

import { AgentTelemetryReplayConflict } from '@/app/lib/agent-usage-store';
import { POST } from './route';

const usage = {
  schema: 'agent-usage-sample/v1' as const,
  sample_id: 'attempt-1',
  observed_at: '2026-08-31T19:00:00.000Z',
  provider: 'google',
  harness: 'antigravity',
  model: 'gemini-3.7-flash-high',
  effort: 'high',
  accounting_contract: 'antigravity-headless-usage-delta/v1',
  run_ref: 'stensibly:run_abc123',
  input_tokens: 10_415,
  cached_input_tokens: 8_113,
  cache_write_input_tokens: null,
  reasoning_tokens: 616,
  output_tokens: 657,
  total_tokens: 11_072,
  request_count: null,
  turn_count: 1,
  agent_step_count: null,
};

const quota = {
  schema: 'provider-quota-sample/v1' as const,
  sample_id: 'attempt-1-after',
  observed_at: '2026-08-31T19:00:30.000Z',
  provider: 'google',
  harness: 'antigravity',
  model: 'gemini-3.7-flash-high',
  plan_class: 'google-ai-pro',
  quota_contract: 'antigravity-statusline-quota/v1',
  limit_id: 'gemini-weekly',
  window_minutes: null,
  percent_orientation: 'remaining' as const,
  percent_value: 98,
  resets_at: '2026-09-06T12:00:00.000Z',
  balance_unit: null,
  balance_value: null,
};

const report = {
  schema: 'agent-telemetry-report/v1' as const,
  source: 'big-red',
  collected_at: '2026-08-31T19:01:00.000Z',
  usage_samples: [usage],
  quota_samples: [quota],
};

function request(body: string, token = 'test-secret') {
  return new NextRequest(
    'http://localhost/api/machine-health/agent-usage/ingest',
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

describe('provider-neutral agent telemetry ingestion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T19:01:00.000Z'));
    vi.stubEnv('MACHINE_HEALTH_INGEST_SECRET', 'test-secret');
    saveAgentTelemetryReport.mockResolvedValue({
      source: 'big-red',
      collectedAt: report.collected_at,
      usageInserted: 1,
      usageReplayed: 0,
      quotaInserted: 1,
      quotaReplayed: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('stores only a sanitized provider-neutral report', async () => {
    const response = await POST(request(JSON.stringify(report)));

    expect(response.status).toBe(200);
    expect(saveAgentTelemetryReport).toHaveBeenCalledWith(report);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      source: 'big-red',
      usage_inserted: 1,
      quota_inserted: 1,
    });
  });

  it('rejects bad credentials, empty reports, and raw provider payload fields', async () => {
    expect((await POST(request('{}', 'wrong-secret'))).status).toBe(401);

    const empty = { ...report, usage_samples: [], quota_samples: [] };
    expect((await POST(request(JSON.stringify(empty)))).status).toBe(400);

    const raw = {
      ...report,
      email: 'private@example.com',
      transcript_path: '/home/leo/private.jsonl',
    };
    expect((await POST(request(JSON.stringify(raw)))).status).toBe(400);
    expect(saveAgentTelemetryReport).not.toHaveBeenCalled();
  });

  it('rejects future and over-age observations before storage', async () => {
    const invalidReports = [
      {
        ...report,
        collected_at: '2026-09-01T19:01:00.000Z',
      },
      {
        ...report,
        usage_samples: [
          { ...usage, observed_at: '2026-05-01T19:00:00.000Z' },
        ],
      },
      {
        ...report,
        quota_samples: [
          { ...quota, observed_at: '2026-08-31T20:00:00.000Z' },
        ],
      },
    ];

    for (const invalid of invalidReports)
      expect((await POST(request(JSON.stringify(invalid)))).status).toBe(400);
    expect(saveAgentTelemetryReport).not.toHaveBeenCalled();
  });

  it('returns a conflict for a changed replay under an immutable sample key', async () => {
    saveAgentTelemetryReport.mockRejectedValueOnce(
      new AgentTelemetryReplayConflict('usage')
    );

    const response = await POST(request(JSON.stringify(report)));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      sample_class: 'usage',
    });
  });

  it('reports exact replay counts separately from new inserts', async () => {
    saveAgentTelemetryReport.mockResolvedValueOnce({
      source: 'big-red',
      collectedAt: report.collected_at,
      usageInserted: 0,
      usageReplayed: 1,
      quotaInserted: 0,
      quotaReplayed: 1,
    });

    const response = await POST(request(JSON.stringify(report)));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      usage_inserted: 0,
      usage_replayed: 1,
      quota_inserted: 0,
      quota_replayed: 1,
    });
  });
});
