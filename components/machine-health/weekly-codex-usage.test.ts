import type { CodexTokenSample } from '@/app/lib/machine-health-store';
import { expect, it } from 'vitest';
import { buildWeeklyCodexUsageSnapshots } from './weekly-codex-usage';

function sample(
  windowStartedAt: string,
  overrides: Partial<CodexTokenSample> = {}
): CodexTokenSample {
  const start = Date.parse(windowStartedAt);
  return {
    source: 'big-red',
    accountingState: 'counted',
    windowStartedAt,
    windowEndedAt: new Date(start + 60 * 60_000).toISOString(),
    inputTokens: 1_000,
    cachedInputTokens: 980,
    cacheWriteInputTokens: 0,
    outputTokens: 3,
    reasoningOutputTokens: 2,
    totalTokens: 1_003,
    modelCalls: 4,
    activeRoutes: 1,
    ...overrides,
  };
}

it('groups counted rows into UTC Monday calendar weeks', () => {
  const snapshots = buildWeeklyCodexUsageSnapshots(
    [
      sample('2026-09-10T14:00:00Z'),
      sample('2026-09-10T14:00:00Z', { source: 'macbook-air' }),
      sample('2026-09-06T23:00:00Z', {
        inputTokens: 2_000,
        cachedInputTokens: 1_900,
        outputTokens: 10,
        totalTokens: 2_010,
        modelCalls: 8,
      }),
    ],
    Date.parse('2026-09-10T15:48:00Z'),
    2
  );

  expect(snapshots).toHaveLength(2);
  expect(new Date(snapshots[0].start).toISOString()).toBe(
    '2026-09-07T00:00:00.000Z'
  );
  expect(snapshots[0]).toMatchObject({
    current: true,
    inputTokens: 2_000,
    cachedInputTokens: 1_960,
    outputTokens: 6,
    totalTokens: 2_006,
    modelCalls: 8,
    sourceHours: 2,
  });
  expect(new Date(snapshots[1].start).toISOString()).toBe(
    '2026-08-31T00:00:00.000Z'
  );
  expect(snapshots[1]).toMatchObject({
    current: false,
    inputTokens: 2_000,
    cachedInputTokens: 1_900,
    outputTokens: 10,
    totalTokens: 2_010,
    modelCalls: 8,
    sourceHours: 1,
  });
});

it('excludes overlap rows and the in-progress UTC hour', () => {
  const snapshots = buildWeeklyCodexUsageSnapshots(
    [
      sample('2026-09-10T14:00:00Z'),
      sample('2026-09-10T14:00:00Z', {
        accountingState: 'overlap-skipped',
      }),
      sample('2026-09-10T15:00:00Z', {
        inputTokens: 99_999,
        cachedInputTokens: 99_999,
        totalTokens: 99_999,
      }),
    ],
    Date.parse('2026-09-10T15:48:00Z')
  );

  expect(snapshots).toHaveLength(1);
  expect(snapshots[0]).toMatchObject({
    inputTokens: 1_000,
    cachedInputTokens: 980,
    outputTokens: 3,
    totalTokens: 1_003,
    modelCalls: 4,
    sourceHours: 1,
  });
});
