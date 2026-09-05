import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ owner: vi.fn(), read: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock('@/app/lib/server/machine-dashboard-owner', () => ({
  hasMachineDashboardOwnerSession: mocks.owner,
}));
vi.mock('@/app/lib/agent-usage-store', async importOriginal => {
  const original =
    await importOriginal<typeof import('@/app/lib/agent-usage-store')>();
  return { ...original, readPeerUsageSamples: mocks.read };
});

import { GET } from './route';

const sample = {
  source: 'big-red',
  observedAt: '2026-09-05T06:00:00.000Z',
  provider: 'anthropic',
  harness: 'claude-code',
  model: 'claude-opus-5',
  effort: 'high',
  accountingContract: 'big-red-agent-peer-usage/v1',
  inputTokens: 1000,
  cachedInputTokens: 800,
  cacheWriteInputTokens: 100,
  reasoningTokens: null,
  outputTokens: 200,
  totalTokens: 1200,
  requestCount: 2,
  successfulRequestCount: 1,
  apiEquivalentEstimateUsd: 0.25,
  turnCount: null,
  agentStepCount: null,
};

function request(days?: number) {
  const url = `http://localhost/api/machine-health/agent-usage/summary${days === undefined ? '' : `?days=${days}`}`;
  return new Request(url);
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('MACHINE_HEALTH_DASHBOARD_TOKEN', '');
  vi.stubEnv('PROXY_DASHBOARD_TOKEN', '');
  mocks.owner.mockResolvedValue(false);
  mocks.read.mockReset();
  mocks.read.mockResolvedValue([sample]);
});

it('refuses the compact projection without private access', async () => {
  const response = await GET(request());
  expect(response.status).toBe(403);
  expect(mocks.read).not.toHaveBeenCalled();
});

it('returns provider-labelled groups without relabelling peer work as Codex', async () => {
  mocks.owner.mockResolvedValue(true);
  const response = await GET(request(7));
  expect(response.status).toBe(200);
  expect(mocks.read).toHaveBeenCalledWith(7);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.schema).toBe('peer-usage-summary/v1');
  expect(body.unavailable).toBe(false);
  expect(body.groups).toHaveLength(1);
  expect(body.groups[0]).toMatchObject({
    provider: 'anthropic',
    harness: 'claude-code',
    lane: 'Claude Code',
    model: 'claude-opus-5',
    runs: 2,
    successful_runs: 1,
    input_tokens: 1000,
    cached_input_tokens: 800,
    api_equivalent_estimate_usd: 0.25,
  });
  expect(JSON.stringify(body)).not.toContain('codex');
});

it('reports unavailable instead of zero when no receipts arrived', async () => {
  mocks.owner.mockResolvedValue(true);
  mocks.read.mockResolvedValue([]);
  const response = await GET(request());
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.unavailable).toBe(true);
  expect(body.groups).toEqual([]);
});

it('returns a recoverable unavailable state without leaking database errors', async () => {
  mocks.owner.mockResolvedValue(true);
  mocks.read.mockRejectedValue(new Error('private database contents'));
  const response = await GET(request());
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('database');
});
