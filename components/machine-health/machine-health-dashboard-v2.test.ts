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
import { MachineHealthDashboard } from './machine-health-dashboard-v2';

const checkedAt = healthyMachineReport.checked_at;
const report = {
  host: 'big-red' as const,
  payload: healthyMachineReport,
  checkedAt,
  updatedAt: checkedAt,
};
const sample: MachineHealthSample = {
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
  options: { private?: boolean; reportOverride?: StoredMachineHealth } = {}
) {
  return renderToStaticMarkup(
    createElement(MachineHealthDashboard, {
      report: options.reportOverride ?? report,
      samples: [sample],
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
    expect(html).toContain('Online');
    expect(html).toContain('Resources');
    expect(html).toContain('CPU');
    expect(html).toContain('Memory');
    expect(html).toContain('Storage');
    expect(html).toContain('800 GiB free');
    expect(html).toContain('Codex');
    expect(html).toContain('Total tokens');
    expect(html).toContain('12,542,000');
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

    expect(html).toContain('Online');
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
});
