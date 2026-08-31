import { describe, expect, it } from 'vitest';
import { analyzeCodexQuotaBurn } from './codex-quota-analysis';
import type { CodexQuotaSample } from './codex-quota-store';
import type { CodexTokenSample } from './machine-health-store';

function quota(
  observedAt: string,
  usedPercent: number,
  resetsAt: string
): CodexQuotaSample {
  return {
    source: 'macbook-air',
    observedAt,
    limitId: 'codex',
    windowMinutes: 10_080,
    usedPercent,
    resetsAt,
  };
}

function token(windowStartedAt: string): CodexTokenSample {
  const started = new Date(windowStartedAt);
  return {
    source: 'macbook-air',
    accountingState: 'counted',
    windowStartedAt,
    windowEndedAt: new Date(started.getTime() + 3_600_000).toISOString(),
    inputTokens: 90,
    cachedInputTokens: 0,
    cacheWriteInputTokens: 0,
    outputTokens: 10,
    reasoningOutputTokens: 0,
    totalTokens: 100,
    modelCalls: 10,
    activeRoutes: 1,
  };
}

describe('analyzeCodexQuotaBurn', () => {
  it('measures milestone bands and cumulative saturation ranges', () => {
    const firstReset = '2026-09-01T00:00:00Z';
    const secondReset = '2026-09-08T00:00:00Z';
    const quotaSamples = [
      quota('2026-08-24T00:00:00Z', 0, firstReset),
      quota('2026-08-24T01:00:00Z', 10, firstReset),
      quota('2026-08-24T02:00:00Z', 50, firstReset),
      quota('2026-08-24T03:00:00Z', 75, firstReset),
      quota('2026-08-24T04:00:00Z', 100, firstReset),
      quota('2026-08-31T00:00:00Z', 0, secondReset),
      quota('2026-08-31T02:00:00Z', 25, secondReset),
    ];
    const tokenSamples = [
      ...Array.from({ length: 4 }, (_, index) =>
        token(`2026-08-24T0${index}:00:00Z`)
      ),
      token('2026-08-31T00:00:00Z'),
      token('2026-08-31T01:00:00Z'),
    ];

    const summary = analyzeCodexQuotaBurn(quotaSamples, tokenSamples);

    expect(summary?.current).toMatchObject({
      usedPercent: 25,
      recordedTokensSinceReset: 200,
      projectedTokensAt100: 800,
    });
    expect(summary?.lastSaturation?.ranges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromPercent: 0,
          toPercent: 100,
          recordedTokens: 400,
        }),
        expect.objectContaining({
          fromPercent: 50,
          toPercent: 100,
          recordedTokens: 200,
        }),
        expect.objectContaining({
          fromPercent: 75,
          toPercent: 100,
          recordedTokens: 100,
        }),
      ])
    );
  });

  it('does not invent a full-cycle range from a zero observed after saturation', () => {
    const reset = '2026-09-01T00:00:00Z';
    const summary = analyzeCodexQuotaBurn(
      [
        quota('2026-08-24T00:00:00Z', 25, reset),
        quota('2026-08-24T01:00:00Z', 50, reset),
        quota('2026-08-24T02:00:00Z', 100, reset),
        quota('2026-08-24T03:00:00Z', 0, reset),
      ],
      [token('2026-08-24T00:00:00Z'), token('2026-08-24T01:00:00Z')]
    );

    expect(summary?.lastSaturation?.ranges).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ fromPercent: 0 })])
    );
    expect(summary?.lastSaturation?.ranges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromPercent: 50, recordedTokens: 100 }),
      ])
    );
  });
});
