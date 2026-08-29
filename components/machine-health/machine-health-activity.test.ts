import { describe, expect, it } from 'vitest';

import type { MachineHealthSample } from '@/app/lib/machine-health-store';
import { buildActivityBins } from './machine-health-activity';

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
    codexOutputTokens: null,
    codexReasoningOutputTokens: null,
    codexModelCalls: null,
    codexActiveRoutes: null,
    routeActiveRoutes: null,
    routeActiveJobs: null,
    routeTaggedProcesses: null,
    routeTaggedRssBytes: null,
    routeResidueJobs: null,
    routeUnknownCount: null,
    buildStateGib: null,
    buildTargetCount: null,
    activeBuildProcesses: null,
    ...overrides,
  };
}

describe('machine health activity bins', () => {
  it('builds 24 fixed hourly bins and averages samples in the same hour', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', { cpuUsedPercent: 10 }),
        sample('2026-08-29T06:25:00.000Z', { cpuUsedPercent: 30 }),
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
      codexOutputTokens: 50,
      codexReasoningOutputTokens: 20,
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
      codexOutputTokens: 50,
      codexReasoningOutputTokens: 20,
      codexModelCalls: 4,
      codexActiveRoutes: 2,
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
});
