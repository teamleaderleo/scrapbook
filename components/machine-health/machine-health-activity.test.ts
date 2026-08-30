import { describe, expect, it } from 'vitest';

import type {
  CodexTokenSample,
  MachineHealthSample,
} from '@/app/lib/machine-health-store';
import {
  buildActivityBins,
  buildCodexActivityBins,
} from './machine-health-activity';

const now = Date.parse('2026-08-29T06:30:00.000Z');

function sample(
  checkedAt: string,
  overrides: Partial<MachineHealthSample> = {}
): MachineHealthSample {
  return {
    checkedAt,
    cpuUsedPercent: 20,
    rootUsedPercent: 10,
    memoryUsedPercent: 30,
    loadPerCpu: 0.1,
    peakSensorTemperatureC: 50,
    graphicsClockMhz: 400,
    networkRxMibS: 0.5,
    networkTxMibS: 0.25,
    diskReadMibS: 1,
    diskWriteMibS: 2,
    pressurePercent: 0.5,
    activitySource: 'sysstat-10m',
    activitySampleCount: 6,
    activityWindowMinutes: 60,
    uptimeSeconds: 86_400,
    browserRoots: 1,
    browserRssBytes: 1_073_741_824,
    codexWorkers: 2,
    failedUnits: 0,
    unexpectedDevListeners: 0,
    rdpConnections: 0,
    codexUsageWindowStartedAt: null,
    codexInputTokens: null,
    codexCachedInputTokens: null,
    codexCacheWriteInputTokens: null,
    codexOutputTokens: null,
    codexReasoningOutputTokens: null,
    codexTotalTokens: null,
    codexModelCalls: null,
    codexActiveRoutes: null,
    routeActiveRoutes: null,
    routeActiveJobs: null,
    routeTaggedProcesses: null,
    routeTaggedRssBytes: null,
    routeTaggedMemoryBytes: null,
    routeResidueJobs: null,
    routeUnknownCount: null,
    codexStateAllocatedBytes: null,
    buildStateGib: null,
    buildTargetCount: null,
    activeBuildProcesses: null,
    ...overrides,
  };
}

function tokenSample(
  source: CodexTokenSample['source'],
  overrides: Partial<CodexTokenSample> = {}
): CodexTokenSample {
  return {
    source,
    accountingState: 'counted',
    windowStartedAt: '2026-08-29T05:00:00.000Z',
    windowEndedAt: '2026-08-29T06:00:00.000Z',
    inputTokens: 1_000,
    cachedInputTokens: 800,
    cacheWriteInputTokens: 100,
    outputTokens: 50,
    reasoningOutputTokens: 20,
    totalTokens: 1_050,
    modelCalls: 4,
    activeRoutes: 2,
    ...overrides,
  };
}

describe('machine health activity bins', () => {
  it('builds 10 complete hourly bins without the current partial hour', () => {
    const bins = buildCodexActivityBins(
      [
        tokenSample('big-red'),
        tokenSample('macbook-air', {
          inputTokens: 500,
          cachedInputTokens: 400,
          cacheWriteInputTokens: 0,
          outputTokens: 25,
          reasoningOutputTokens: 10,
          totalTokens: 525,
          modelCalls: 2,
          activeRoutes: 1,
        }),
      ],
      '10h',
      now
    );

    expect(bins).toHaveLength(10);
    expect(bins.at(-1)).toMatchObject({
      start: Date.parse('2026-08-29T05:00:00.000Z'),
      codexInputTokens: 1_500,
      codexCachedInputTokens: 1_200,
      codexCacheWriteInputTokens: 100,
      codexTotalTokens: 1_575,
      codexActiveRoutes: 3,
      codexHourCount: 1,
      codexSourceHours: { 'big-red': 1, 'macbook-air': 1 },
      codexWindowCount: 2,
      codexSkippedCount: 0,
    });
    expect(
      bins.some(bin => bin.start === Date.parse('2026-08-29T06:00:00.000Z'))
    ).toBe(false);
  });

  it('builds 24 fixed hourly bins and averages samples in the same hour', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', { cpuUsedPercent: 10 }),
        sample('2026-08-29T06:25:00.000Z', {
          cpuUsedPercent: 30,
          buildStateGib: 51.65,
          codexStateAllocatedBytes: 1_849_430_016,
        }),
      ],
      '24h',
      now
    );

    expect(bins).toHaveLength(24);
    expect(bins.at(-1)).toMatchObject({
      sampleCount: 2,
      cpuUsedPercent: 20,
      networkMibS: 0.75,
      diskMibS: 3,
      pressurePercent: 0.5,
      browserRssMib: 1024,
      buildStateGib: 51.65,
      codexStateMib: 1763.75390625,
    });
  });

  it('does not add a cross-device overlap to token totals', () => {
    const bins = buildCodexActivityBins(
      [
        tokenSample('big-red'),
        tokenSample('macbook-air', {
          accountingState: 'overlap-skipped',
          inputTokens: 9_999,
          cachedInputTokens: 9_999,
          totalTokens: 10_000,
        }),
      ],
      '10h',
      now
    );

    expect(bins.at(-1)).toMatchObject({
      codexInputTokens: 1_000,
      codexCachedInputTokens: 800,
      codexTotalTokens: 1_050,
      codexHourCount: 1,
      codexSourceHours: { 'big-red': 1, 'macbook-air': 0 },
      codexWindowCount: 1,
      codexSkippedCount: 1,
    });
  });

  it('keeps long ranges as rolling complete hours and counts source-hours', () => {
    const bins = buildCodexActivityBins(
      [
        tokenSample('big-red', {
          windowStartedAt: '2026-08-28T06:00:00.000Z',
          windowEndedAt: '2026-08-28T07:00:00.000Z',
        }),
        tokenSample('big-red'),
        tokenSample('macbook-air'),
      ],
      '7d',
      now
    );

    expect(bins).toHaveLength(7);
    expect(bins.at(-1)).toMatchObject({
      start: Date.parse('2026-08-28T06:00:00.000Z'),
      end: Date.parse('2026-08-29T06:00:00.000Z'),
      codexHourCount: 2,
      codexSourceHours: { 'big-red': 2, 'macbook-air': 1 },
      codexWindowCount: 3,
    });
  });

  it('preserves empty bins rather than connecting observations across gaps', () => {
    const bins = buildActivityBins(
      [sample('2026-08-29T06:05:00.000Z')],
      '7d',
      now
    );

    expect(bins).toHaveLength(7);
    expect(bins.filter(bin => bin.sampleCount === 0)).toHaveLength(6);
    expect(bins.at(-1)?.sampleCount).toBe(1);
  });

  it('marks fallback, partial coverage, and uptime discontinuities', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T05:05:00.000Z', {
          activitySampleCount: 4,
          activityWindowMinutes: 40,
          uptimeSeconds: 10_000,
        }),
        sample('2026-08-29T06:05:00.000Z', {
          activitySource: 'point',
          activitySampleCount: 1,
          activityWindowMinutes: 0,
          uptimeSeconds: 100,
        }),
      ],
      '24h',
      now
    );

    expect(bins.at(-2)).toMatchObject({ undercoveredCount: 1 });
    expect(bins.at(-1)).toMatchObject({ fallbackCount: 1, rebootCount: 1 });
  });

  it('places Codex counters in their fixed usage hour and deduplicates retries', () => {
    const usage = {
      codexUsageWindowStartedAt: '2026-08-29T05:00:00.000Z',
      codexInputTokens: 1_000,
      codexCachedInputTokens: 800,
      codexCacheWriteInputTokens: 100,
      codexOutputTokens: 50,
      codexReasoningOutputTokens: 20,
      codexTotalTokens: 1_050,
      codexModelCalls: 4,
      codexActiveRoutes: 2,
    };
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', usage),
        sample('2026-08-29T06:10:00.000Z', usage),
      ],
      '24h',
      now
    );

    expect(bins.at(-2)).toMatchObject({
      codexInputTokens: 1_000,
      codexCachedInputTokens: 800,
      codexCacheWriteInputTokens: 100,
      codexOutputTokens: 50,
      codexReasoningOutputTokens: 20,
      codexTotalTokens: 1_050,
      codexModelCalls: 4,
      codexActiveRoutes: 2,
      codexWindowCount: 1,
    });
    expect(bins.at(-1)?.codexInputTokens).toBeNull();
  });

  it('keeps the highest tagged process count in each observation bin', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', {
          routeTaggedProcesses: 3,
        }),
        sample('2026-08-29T06:25:00.000Z', {
          routeTaggedProcesses: 17,
        }),
      ],
      '24h',
      now
    );

    expect(bins.at(-1)?.routeTaggedProcesses).toBe(17);
    expect(bins.at(-2)?.routeTaggedProcesses).toBeNull();
  });

  it('keeps the highest current tagged cgroup memory in each bin', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', {
          routeTaggedMemoryBytes: 128 * 1_024 ** 2,
        }),
        sample('2026-08-29T06:25:00.000Z', {
          routeTaggedMemoryBytes: 384 * 1_024 ** 2,
        }),
      ],
      '24h',
      now
    );

    expect(bins.at(-1)?.routeTaggedMemoryMib).toBe(384);
    expect(bins.at(-2)?.routeTaggedMemoryMib).toBeNull();
  });

  it('keeps storage gauge highs without turning unavailable data into zero', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', {
          buildStateGib: 48,
          codexStateAllocatedBytes: 1_024 ** 3,
        }),
        sample('2026-08-29T06:25:00.000Z', {
          buildStateGib: 52,
          codexStateAllocatedBytes: 2 * 1_024 ** 3,
        }),
      ],
      '24h',
      now
    );

    expect(bins.at(-1)).toMatchObject({
      buildStateGib: 52,
      codexStateMib: 2048,
    });
    expect(bins.at(-2)).toMatchObject({
      buildStateGib: null,
      codexStateMib: null,
    });
  });
});
