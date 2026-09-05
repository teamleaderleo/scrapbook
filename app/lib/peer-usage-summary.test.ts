import { describe, expect, it } from 'vitest';
import type { PeerUsageSampleRow } from './agent-usage-store';
import { peerLaneLabel, summarizePeerUsage } from './peer-usage-summary';

function row(overrides: Partial<PeerUsageSampleRow> = {}): PeerUsageSampleRow {
  return {
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
    ...overrides,
  };
}

describe('summarizePeerUsage', () => {
  it('keeps provider lanes separate and sums complete-hour rows', () => {
    const groups = summarizePeerUsage([
      row(),
      row({ observedAt: '2026-09-05T05:00:00.000Z', requestCount: 1, successfulRequestCount: 1, inputTokens: 500, cachedInputTokens: 100, cacheWriteInputTokens: 50, outputTokens: 60, totalTokens: 560, apiEquivalentEstimateUsd: 0.1 }),
      row({
        provider: 'google',
        harness: 'antigravity',
        model: 'gemini-3.7-flash-high',
        accountingContract: 'big-red-agent-peer-usage/v1',
        inputTokens: 2000,
        cachedInputTokens: 400,
        cacheWriteInputTokens: null,
        reasoningTokens: 120,
        outputTokens: 250,
        totalTokens: 2250,
        requestCount: 1,
        successfulRequestCount: 0,
        apiEquivalentEstimateUsd: null,
      }),
      row({
        provider: 'opencode-zen',
        harness: 'muse',
        model: 'muse-spark',
        effort: 'provider-default',
        accountingContract: 'big-red-muse-peer-usage/v1',
        reasoningTokens: 40,
        requestCount: 1,
        successfulRequestCount: 1,
        apiEquivalentEstimateUsd: null,
        agentStepCount: 2,
      }),
    ]);

    expect(groups).toHaveLength(3);
    const [claude, google, muse] = groups;
    expect(claude.lane).toBe('Claude Code');
    expect(claude.runs).toBe(3);
    expect(claude.successfulRuns).toBe(2);
    expect(claude.hoursObserved).toBe(2);
    expect(claude.inputTokens).toBe(1500);
    expect(claude.cachedInputTokens).toBe(900);
    expect(claude.apiEquivalentEstimateUsd).toBeCloseTo(0.35, 8);
    expect(google.lane).toBe('Antigravity');
    expect(google.reasoningTokens).toBe(120);
    expect(google.cacheWriteInputTokens).toBeNull();
    expect(google.apiEquivalentEstimateUsd).toBeNull();
    expect(muse.lane).toBe('Muse');
  });

  it('keeps missing evidence unknown instead of zero', () => {
    const groups = summarizePeerUsage([
      row({
        inputTokens: null,
        cachedInputTokens: null,
        cacheWriteInputTokens: null,
        outputTokens: null,
        totalTokens: null,
        requestCount: null,
        successfulRequestCount: null,
        apiEquivalentEstimateUsd: null,
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].runs).toBe(0);
    expect(groups[0].runsUnknown).toBe(true);
    expect(groups[0].successfulRuns).toBeNull();
    expect(groups[0].inputTokens).toBeNull();
    expect(groups[0].apiEquivalentEstimateUsd).toBeNull();
  });

  it('labels unknown harnesses without inventing a lane', () => {
    expect(peerLaneLabel('future-harness')).toBe('future-harness');
  });
});
