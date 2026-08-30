import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type {
  CodexTokenSample,
  MachineHealthSample,
} from '@/app/lib/machine-health-store';
import {
  buildActivityBins,
  buildCodexActivityBins,
  MachineHealthActivity,
} from './machine-health-activity';

const now = Date.parse('2026-08-29T06:30:00.000Z');

function sample(
  checkedAt: string,
  overrides: Partial<MachineHealthSample> = {}
): MachineHealthSample {
  return {
    checkedAt,
    panelOn: null,
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
    codexRuntimeProcesses: null,
    codexRuntimePssBytes: null,
    failedUnits: 0,
    unexpectedDevListeners: 0,
    rdpConnections: 0,
    remoteTransportPath: null,
    remoteRttMs: null,
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
  it('builds 12 complete hourly bins without the current partial hour', () => {
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
      '12h',
      now
    );

    expect(bins).toHaveLength(12);
    expect(bins.at(-1)).toMatchObject({
      start: Date.parse('2026-08-29T05:00:00.000Z'),
      codexInputTokens: 1_500,
      codexCachedInputTokens: 1_200,
      codexCacheWriteInputTokens: 100,
      codexTotalTokens: 1_575,
      codexActiveRoutes: 3,
      codexHourCount: 1,
      codexSourceHours: { 'big-red': 1, 'macbook-air': 1 },
      codexSourceInputTokens: { 'big-red': 1_000, 'macbook-air': 500 },
      codexSourceOutputTokens: { 'big-red': 50, 'macbook-air': 25 },
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
      '12h',
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

  it('weights panel-on share by observed snapshots and keeps unknown coverage', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', { panelOn: true }),
        sample('2026-08-29T06:25:00.000Z', { panelOn: false }),
        sample('2026-08-29T06:45:00.000Z'),
      ],
      '24h',
      now
    );

    expect(bins.at(-1)).toMatchObject({
      sampleCount: 3,
      panelOnPercent: 50,
      panelOnCount: 1,
      panelObservedCount: 2,
    });
    expect(bins.at(-2)).toMatchObject({
      panelOnPercent: null,
      panelOnCount: 0,
      panelObservedCount: 0,
    });
  });

  it('averages only observed Mac probes and preserves path counts', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', {
          remoteTransportPath: 'direct',
          remoteRttMs: 220,
        }),
        sample('2026-08-29T06:25:00.000Z', {
          remoteTransportPath: 'relay',
          remoteRttMs: 260,
        }),
        sample('2026-08-29T06:45:00.000Z'),
      ],
      '24h',
      now
    );

    expect(bins.at(-1)).toMatchObject({
      remoteRttMs: 240,
      remoteProbeCount: 2,
      remoteDirectProbes: 1,
      remoteRelayProbes: 1,
      remotePeerRelayProbes: 0,
    });
    expect(bins.at(-2)).toMatchObject({
      remoteRttMs: null,
      remoteProbeCount: 0,
    });
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

  it('renders source and reboot marks on their exact chart bins', () => {
    const markedSamples = [
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
    ];
    const html = renderToStaticMarkup(
      createElement(MachineHealthActivity, {
        samples: markedSamples,
        codexSamples: [],
        now,
        latestActivity: {
          source: 'point',
          window_minutes: 0,
          sample_count: 1,
          cpu_peak_percent: 20,
          memory_peak_percent: 30,
          cpu_pressure_some_percent: null,
          memory_pressure_full_percent: null,
          io_pressure_full_percent: null,
          disk_read_mib_s: null,
          disk_write_mib_s: null,
        },
      })
    );

    expect(html).toContain('aria-label="Activity chart markers"');
    expect(html).toContain('data-activity-fallback="true"');
    expect(html).toContain('data-activity-partial="true"');
    expect(html).toContain('data-activity-reboot="true"');
    expect(html).toContain('1 fallback, 1 reboot');
    expect(html).toContain('1 partial');
  });

  it('renders path-aware Mac RTT without filling missing probe bins', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthActivity, {
        samples: [
          sample('2026-08-29T05:05:00.000Z', {
            remoteTransportPath: 'direct',
            remoteRttMs: 220,
          }),
          sample('2026-08-29T06:05:00.000Z', {
            remoteTransportPath: 'peer-relay',
            remoteRttMs: 260,
          }),
        ],
        codexSamples: [],
        now,
        latestActivity: {
          source: 'sysstat-10m',
          window_minutes: 60,
          sample_count: 6,
          cpu_peak_percent: 20,
          memory_peak_percent: 30,
          cpu_pressure_some_percent: 0.1,
          memory_pressure_full_percent: 0,
          io_pressure_full_percent: 0,
          disk_read_mib_s: 1,
          disk_write_mib_s: 2,
        },
      })
    );

    expect(html).toContain('Mac transport RTT');
    expect(html).toContain(
      'aria-label="Mac transport RTT across 12 observation bins; 2 probes"'
    );
    expect(html).toContain('data-remote-path="direct"');
    expect(html).toContain('data-remote-path="peer-relay"');
    expect(html).toContain('1 direct');
    expect(html).toContain('1 peer');
    expect(html).toContain('No transport probe');
  });

  it('renders sampled panel history without treating missing state as off', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthActivity, {
        samples: [
          sample('2026-08-29T05:05:00.000Z', { panelOn: true }),
          sample('2026-08-29T06:05:00.000Z', { panelOn: false }),
          sample('2026-08-29T06:15:00.000Z', { panelOn: false }),
          sample('2026-08-29T06:25:00.000Z', { panelOn: false }),
          sample('2026-08-29T06:35:00.000Z'),
        ],
        codexSamples: [],
        now,
        latestActivity: {
          source: 'sysstat-10m',
          window_minutes: 60,
          sample_count: 6,
          cpu_peak_percent: 20,
          memory_peak_percent: 30,
          cpu_pressure_some_percent: 0.1,
          memory_pressure_full_percent: 0,
          io_pressure_full_percent: 0,
          disk_read_mib_s: 1,
          disk_write_mib_s: 2,
        },
      })
    );

    expect(html).toContain('Panel on samples');
    expect(html).toContain(
      'aria-label="Panel on share across 12 observation bins; 4 panel samples"'
    );
    expect(html).toContain('data-panel-observed="true"');
    expect(html).toContain('>25%<');
    expect(html).toContain('1 on');
    expect(html).toContain('3 off');
    expect(html).toContain('1 unknown');
    expect(html).toContain('No panel observation');
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

  it('keeps Codex runtime PSS and process highs without mixing RSS fallback', () => {
    const bins = buildActivityBins(
      [
        sample('2026-08-29T06:05:00.000Z', {
          codexRuntimeProcesses: 70,
          codexRuntimePssBytes: 1_024 ** 3,
        }),
        sample('2026-08-29T06:25:00.000Z', {
          codexRuntimeProcesses: 83,
          codexRuntimePssBytes: 2 * 1_024 ** 3,
        }),
      ],
      '24h',
      now
    );

    expect(bins.at(-1)).toMatchObject({
      codexRuntimeProcesses: 83,
      codexRuntimePssMib: 2048,
    });
    expect(bins.at(-2)).toMatchObject({
      codexRuntimeProcesses: null,
      codexRuntimePssMib: null,
    });
  });
});
