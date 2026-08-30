import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const saveCodexTokenReport = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/machine-health-store', async importOriginal => {
  const original =
    await importOriginal<typeof import('@/app/lib/machine-health-store')>();
  return { ...original, saveCodexTokenReport };
});

import { POST } from './route';

const usage = {
  source: 'session-jsonl' as const,
  window_started_at: '2026-08-29T05:00:00.000Z',
  window_ended_at: '2026-08-29T06:00:00.000Z',
  input_tokens: 1_000,
  cached_input_tokens: 800,
  cache_write_input_tokens: 100,
  output_tokens: 50,
  reasoning_output_tokens: 20,
  total_tokens: 1_050,
  model_calls: 4,
  active_routes: 2,
  session_fingerprints: ['0123456789abcdef0123456789abcdef'],
  fingerprints_complete: true,
};
const report = {
  schema_version: 1 as const,
  source: 'macbook-air' as const,
  collected_at: '2026-08-29T06:05:00.000Z',
  windows: [usage],
};

function request(body: string, token = 'test-secret') {
  return new NextRequest(
    'http://localhost/api/machine-health/codex-usage/ingest',
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

describe('Codex token ingestion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T06:05:00.000Z'));
    vi.stubEnv('MACHINE_HEALTH_INGEST_SECRET', 'test-secret');
    saveCodexTokenReport.mockResolvedValue({
      source: 'macbook-air',
      windows: 1,
      counted: 1,
      skipped: 0,
      ignored: 0,
      collectedAt: report.collected_at,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('stores an allowlisted MacBook Air report', async () => {
    const response = await POST(
      request(JSON.stringify({ ...report, machine_name: 'must-not-survive' }))
    );

    expect(response.status).toBe(200);
    expect(saveCodexTokenReport).toHaveBeenCalledWith(report);
  });

  it('rejects bad credentials and malformed accounting', async () => {
    expect((await POST(request('{}', 'wrong-secret'))).status).toBe(401);
    expect(
      (
        await POST(
          request(
            JSON.stringify({
              ...report,
              windows: [{ ...usage, cached_input_tokens: 1_001 }],
            })
          )
        )
      ).status
    ).toBe(400);
    expect(saveCodexTokenReport).not.toHaveBeenCalled();
  });

  it('rejects duplicate, partial, future, or over-age windows', async () => {
    const invalidReports = [
      { ...report, windows: [usage, usage] },
      {
        ...report,
        windows: [
          usage,
          {
            ...usage,
            window_started_at: '2026-08-29T06:00:00.000+01:00',
            window_ended_at: '2026-08-29T07:00:00.000+01:00',
          },
        ],
      },
      {
        ...report,
        windows: [
          {
            ...usage,
            window_started_at: '2026-08-29T05:30:00.000Z',
            window_ended_at: '2026-08-29T06:30:00.000Z',
          },
        ],
      },
      {
        ...report,
        windows: [
          {
            ...usage,
            window_started_at: '2026-08-29T06:00:00.000Z',
            window_ended_at: '2026-08-29T07:00:00.000Z',
          },
        ],
      },
      {
        ...report,
        windows: [
          {
            ...usage,
            window_started_at: '2026-05-01T05:00:00.000Z',
            window_ended_at: '2026-05-01T06:00:00.000Z',
          },
        ],
      },
    ];

    for (const invalid of invalidReports)
      expect((await POST(request(JSON.stringify(invalid)))).status).toBe(400);
    expect(saveCodexTokenReport).not.toHaveBeenCalled();
  });

  it('returns accounting coverage from the store', async () => {
    saveCodexTokenReport.mockResolvedValueOnce({
      source: 'macbook-air',
      windows: 1,
      counted: 0,
      skipped: 1,
      ignored: 0,
      collectedAt: report.collected_at,
    });

    const response = await POST(request(JSON.stringify(report)));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      counted: 0,
      skipped: 1,
      ignored: 0,
    });
  });
});
