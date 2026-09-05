import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import type {
  CodexTokenSample,
  MachineHealthSample,
  StoredMachineHealth,
} from '@/app/lib/machine-health-store';
import { healthyMachineReport } from '@/tests/fixtures/machine-health';
import {
  buildWindowsVmBins,
  buildPublicActivityBins,
} from './machine-health-overview';
import { MachineHealthDashboard } from './machine-health-dashboard-v2';

const checkedAt = healthyMachineReport.checked_at;
const report = {
  host: 'big-red' as const,
  payload: healthyMachineReport,
  checkedAt,
  updatedAt: checkedAt,
};
const sample: MachineHealthSample = {
  host: 'big-red',
  checkedAt,
  panelOn: false,
  cpuUsedPercent: 12,
  rootUsedPercent: 12,
  memoryUsedPercent: 24,
  loadPerCpu: 0.1,
  peakSensorTemperatureC: 58,
  graphicsClockMhz: 450,
  networkRxMibS: 0.8,
  networkTxMibS: 0.2,
  diskReadMibS: 1.25,
  diskWriteMibS: 2.5,
  pressurePercent: 0.4,
  coreAveragePercent: [12, 18, 9, 24, 11, 15, 8, 20],
  corePeakPercent: [31, 42, 22, 51, 28, 36, 19, 47],
  networkPeakMibS: 8.5,
  diskPeakMibS: 12.25,
  activitySource: 'sysstat-10m',
  activitySampleCount: 6,
  activityWindowMinutes: 60,
  uptimeSeconds: 86_400,
  browserRoots: 1,
  browserRssBytes: 2_684_354_560,
  codexWorkers: 2,
  codexRuntimeProcesses: 69,
  codexRuntimePssBytes: 2_344_271_872,
  failedUnits: 0,
  unexpectedDevListeners: 0,
  rdpConnections: 0,
  remoteTransportPath: 'direct',
  remoteRttMs: 221,
  codexUsageWindowStartedAt: null,
  codexInputTokens: null,
  codexCachedInputTokens: null,
  codexCacheWriteInputTokens: null,
  codexOutputTokens: null,
  codexReasoningOutputTokens: null,
  codexTotalTokens: null,
  codexModelCalls: null,
  codexActiveRoutes: null,
  routeActiveRoutes: 2,
  routeActiveJobs: 3,
  routeTaggedProcesses: 17,
  routeTaggedRssBytes: 536_870_912,
  routeTaggedMemoryBytes: 402_653_184,
  routeResidueJobs: 0,
  routeUnknownCount: 0,
  codexStateAllocatedBytes: 1_849_430_016,
  buildStateGib: 51.65,
  buildTargetCount: 11,
  activeBuildProcesses: 3,
};
const codexSamples: CodexTokenSample[] = [
  {
    source: 'big-red',
    accountingState: 'counted',
    windowStartedAt: '2026-08-29T05:00:00.000Z',
    windowEndedAt: '2026-08-29T06:00:00.000Z',
    inputTokens: 12_500_000,
    cachedInputTokens: 11_875_000,
    cacheWriteInputTokens: 0,
    outputTokens: 42_000,
    reasoningOutputTokens: 13_000,
    totalTokens: 12_542_000,
    modelCalls: 110,
    activeRoutes: 4,
  },
];

function renderDashboard(
  options: {
    private?: boolean;
    reportOverride?: StoredMachineHealth;
    macReport?: StoredMachineHealth;
  } = {}
) {
  return renderToStaticMarkup(
    createElement(MachineHealthDashboard, {
      report: options.reportOverride ?? report,
      macReport: options.macReport,
      samples: [
        sample,
        ...(options.macReport
          ? [
              {
                ...sample,
                host: 'macbook-air' as const,
                cpuUsedPercent: 31,
              },
            ]
          : []),
      ],
      codexSamples,
      now: Date.parse(checkedAt) + 20 * 60_000,
      hasPrivateAccess: options.private ?? false,
      ownerAuthConfigured: true,
    })
  );
}

describe('machine health dashboard v2', () => {
  it('opens on the useful public summary without an auth wall', () => {
    const html = renderDashboard();

    expect(html).toContain('Big Red');
    expect(html).not.toContain('Needs attention');
    expect(html).toContain('Resources');
    expect(html).toContain('CPU');
    expect(html).toContain('Memory');
    expect(html).toContain('Storage');
    expect(html).toContain('800 GiB free');
    expect(html).toContain('Codex');
    expect(html).toContain('Total tokens');
    expect(html).toContain('12,542,000');
    expect(html).toContain('Core activity');
    expect(html).toContain('aria-label="Per-core CPU history"');
    expect(html).toContain('Scraplet is');
    expect(html).toContain('aria-label="Resource history range"');
    expect(html).toContain('aria-label="Codex history range"');
    expect(html).toContain(
      'aria-label="Sign in with Google for private details"'
    );
    expect(html).toContain(
      'aria-label="Sign in with GitHub for private details"'
    );
    expect(html).not.toContain('Worth a look');
    expect(html).not.toContain('Big Red snapshot');
    expect(html).not.toContain('Workspace hygiene');
    expect(html).not.toContain('Process scopes');
    expect(html).not.toContain('Use recovery token');
  });

  it('does not turn failed services into a headline warning', () => {
    const html = renderDashboard({
      reportOverride: {
        ...report,
        payload: {
          ...report.payload,
          services: { ...report.payload.services, failed_user_units: 3 },
        },
      },
    });
    expect(html).not.toContain('Needs attention');
    expect(html).not.toContain('3 services failed');
    expect(html).not.toContain('Big Red diagnostics');
  });

  it('keeps resolved 24-hour incidents out of the headline', () => {
    const incidentReport: StoredMachineHealth = {
      ...report,
      payload: {
        ...report.payload,
        reliability: {
          source: 'journal-24h' as const,
          window_hours: 24,
          crash_exits: 1,
          automatic_restarts: 1,
          breakdown: {
            desktop_search: { crash_exits: 1, automatic_restarts: 1 },
            other: { crash_exits: 0, automatic_restarts: 0 },
          },
          truncated: false,
        },
      },
    };
    const html = renderDashboard({ reportOverride: incidentReport });

    expect(html).not.toContain('Needs attention');
    expect(html).not.toContain('Current issue');
    expect(html).not.toContain('Desktop search');
  });

  it('reveals operational diagnostics only with private access', () => {
    const html = renderDashboard({ private: true });

    expect(html).toContain('Private details');
    expect(html).toContain('Services');
    expect(html).toContain('Remote access');
    expect(html).toContain('Agent routes');
    expect(html).toContain('Codex runtime');
    expect(html).not.toContain('Sign in with Google for private details');
  });

  it('offers a resource device switch when Mac history is available', () => {
    const macReport: StoredMachineHealth = {
      ...report,
      host: 'macbook-air',
      payload: { ...report.payload, host: 'macbook-air' },
    };
    const html = renderDashboard({ macReport });

    expect(html).toContain('aria-label="Activity monitor device"');
    expect(html).toContain('aria-label="Resource device"');
    expect(html).toContain('aria-label="Codex usage device"');
    expect(html).toContain('aria-label="Model usage device"');
    expect(html).toContain('Big Red');
    expect(html).toContain('Air Blue');
  });
});

describe('Windows VM history', () => {
  it('keeps missing reports empty and aggregates host measurements without mixing Macs', () => {
    const vm = {
      source: 'libvirt' as const,
      state: 'running' as const,
      vcpus: 14,
      allocated_gib: 12,
      resident_gib: 8,
      cpu_cores: 2,
    };
    const bins = buildWindowsVmBins(
      [
        { ...sample, windowsVm: vm },
        { ...sample, windowsVm: { ...vm, resident_gib: 10, cpu_cores: 4 } },
        {
          ...sample,
          windowsVm: {
            ...vm,
            state: 'off',
            resident_gib: null,
            cpu_cores: null,
          },
        },
        { ...sample, windowsVm: { source: 'unavailable' } },
        {
          ...sample,
          host: 'macbook-air',
          windowsVm: { ...vm, resident_gib: 100 },
        },
      ],
      '12h',
      Date.parse(checkedAt) + 1
    );
    const measured = bins.filter(bin => bin.observations > 0);
    expect(measured).toHaveLength(1);
    expect(measured[0]).toMatchObject({ memory: 10, cpu: 3, observations: 3 });
    expect(measured[0].running).toBeCloseTo(200 / 3);
    expect(
      bins
        .filter(bin => bin.observations === 0)
        .every(
          bin => bin.memory === null && bin.cpu === null && bin.running === null
        )
    ).toBe(true);
  });

  it('shows precise capacity, swap and VM provenance', () => {
    const html = renderDashboard({
      reportOverride: {
        ...report,
        payload: {
          ...report.payload,
          memory: {
            ...report.payload.memory,
            accounting: 'available',
            current_used_gib: 16.5,
            total_gib: 30.8,
            swap_used_gib: 0.11,
            swap_total_gib: 8,
          },
          windows_vm: {
            source: 'libvirt',
            state: 'running',
            vcpus: 14,
            allocated_gib: 12,
            resident_gib: 11.99,
            cpu_cores: 0.12,
          },
        },
      },
    });
    expect(html).toContain('16.5 / 30.8 GiB');
    expect(html).toContain('0.11 / 8.0 GiB');
    expect(html).toContain('12.0 GiB allocated');
    expect(html).toContain('14 vCPUs');
    expect(html).toContain('11.99 GiB');
    expect(html).toContain('included in Big Red');
  });
});

it('does not mix legacy Linux RAM accounting into corrected history', () => {
  const publicSample = {
    ...sample,
    coreAveragePercent: null,
    corePeakPercent: null,
    networkPeakMibS: null,
    diskPeakMibS: null,
  };
  const bins = buildPublicActivityBins(
    [
      {
        ...publicSample,
        memoryComparable: false,
        memoryUsedPercent: 6,
        memoryTotalGib: 30,
      },
      {
        ...publicSample,
        memoryComparable: true,
        memoryUsedPercent: 50,
        memoryTotalGib: 32,
      },
    ],
    '12h',
    Date.parse(checkedAt) + 1
  );
  const measured = bins.find(bin => bin.memoryLegacyCount > 0)!;
  expect(measured.memoryUsedPercent).toBe(50);
  expect(measured.memoryUsedGib).toBe(16);
});
