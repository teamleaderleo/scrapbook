import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { healthyMachineReport } from '@/tests/fixtures/machine-health';
import { MachineHealthDashboard } from './machine-health-dashboard';

const checkedAt = healthyMachineReport.checked_at;
const report = {
  host: 'big-red' as const,
  payload: healthyMachineReport,
  checkedAt,
  updatedAt: checkedAt,
};
const samples = Array.from({ length: 4 }, (_, index) => ({
  checkedAt: new Date(
    Date.parse(checkedAt) - (3 - index) * 86_400_000
  ).toISOString(),
  cpuUsedPercent: 12 + index,
  rootUsedPercent: 11 + index,
  memoryUsedPercent: 20 + index,
  loadPerCpu: 0.08 + index / 100,
  peakSensorTemperatureC: 50 + index,
  graphicsClockMhz: 300 + index * 50,
  networkRxMibS: 0.4 + index / 10,
  networkTxMibS: 0.1 + index / 20,
  diskReadMibS: 1 + index / 10,
  diskWriteMibS: 2 + index / 10,
  pressurePercent: 0.2 + index / 10,
  activitySource: 'sysstat-10m' as const,
  activitySampleCount: 6,
  activityWindowMinutes: 60,
  uptimeSeconds: 86_400 + index * 86_400,
  browserRoots: 1,
  browserRssBytes: 2_147_483_648,
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
  buildStateGib: index === 0 ? 49.2 : 51.65,
  buildTargetCount: 11,
  activeBuildProcesses: 3,
}));

describe('machine health dashboard', () => {
  it('renders a summary-first healthy snapshot without sensitive detail fields', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report,
        samples,
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('Looks good');
    expect(html).not.toContain('No configured guardrail');
    expect(html).toContain('4 stored observations');
    expect(html).toContain('Activity');
    expect(html).toContain('Codex');
    expect(html).toContain('CPU');
    expect(html).toContain('Contention high');
    expect(html).toContain('iGPU clock');
    expect(html).toContain('Build state');
    expect(html).toContain('51.6 GiB');
    expect(html).toContain('11 targets · 1.2 GiB cache · 3 building');
    expect(html).toContain('Browser RSS');
    expect(html).toContain('2.5 GiB');
    expect(html).toContain('RDP');
    expect(html).toContain('Idle');
    expect(html).not.toContain('private_ip');
    expect(html).not.toContain('process_arguments');
  });

  it('turns an otherwise healthy but stale report into a visible watch state', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report,
        samples,
        now: Date.parse(checkedAt) + 4 * 60 * 60_000,
      })
    );

    expect(html).toContain('Worth a look');
    expect(html).toContain('Snapshot is 4 hours old.');
  });

  it('shows the seven-day build-state delta when history is available', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report,
        samples: [
          {
            ...samples[0],
            checkedAt: new Date(
              Date.parse(checkedAt) - 8 * 86_400_000
            ).toISOString(),
            buildStateGib: 49.15,
          },
          ...samples,
        ],
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('+2.5 GiB / 7d');
  });

  it('shows the seven-day browser-memory delta when history is available', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report,
        samples: [
          {
            ...samples[0],
            checkedAt: new Date(
              Date.parse(checkedAt) - 8 * 86_400_000
            ).toISOString(),
            browserRssBytes: 2_147_483_648,
          },
          ...samples,
        ],
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('+512 MiB / 7d');
  });
});
