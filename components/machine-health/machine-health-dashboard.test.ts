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
  routeActiveRoutes: 2,
  routeActiveJobs: 3,
  routeTaggedProcesses: 17,
  routeTaggedRssBytes: 536_870_912,
  routeTaggedMemoryBytes: 402_653_184,
  routeResidueJobs: 0,
  routeUnknownCount: 0,
  codexStateAllocatedBytes: 1_849_430_016,
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
    expect(html).toContain('Build state high');
    expect(html).toContain('Codex state high');
    expect(html).toContain('Codex');
    expect(html).toContain('Cache reads');
    expect(html).toContain('Cache writes');
    expect(html).toContain('CPU');
    expect(html).toContain('Contention high');
    expect(html).toContain('iGPU clock');
    expect(html).toContain('Build state');
    expect(html).toContain('51.6 GiB');
    expect(html).toContain('11 targets · 1.2 GiB cache · 3 building');
    expect(html).toContain('Browser RSS');
    expect(html).toContain('2.5 GiB');
    expect(html).toContain('Codex state');
    expect(html).toContain('1.7 GiB');
    expect(html).toContain('876 MiB active · 888 MiB unknown');
    expect(html).toContain('partial · 0 MiB reclaimable · 7.4 s');
    expect(html).toContain('Remote');
    expect(html).toContain('Direct');
    expect(html).toContain('GRD active · VA-API ready');
    expect(html).toContain('Remote desktop: active');
    expect(html).toContain('RDP graphics: VA-API ready');
    expect(html).toContain('Agent routes');
    expect(html).toContain('Process scopes');
    expect(html).toContain('0 / 18');
    expect(html).toContain('3 roots · 129 MiB · partial visibility');
    expect(html).toContain('3 jobs · 17 proc · 512 MiB');
    expect(html).toContain(
      '384 MiB memory · 192 MiB job peak · 2.5 s CPU · I/O —'
    );
    expect(html).toContain('I/O 0/3');
    expect(html).toContain('Agent memory high');
    expect(html).toContain('Tagged-process high');
    expect(html).toContain('Crashes · 24h: 0');
    expect(html).toContain('Auto restarts · 24h: 0');
    expect(html).not.toContain('private_ip');
    expect(html).not.toContain('process_arguments');
  });

  it('shows an offline Mac without turning expected absence into a fault', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report: {
          ...report,
          payload: {
            ...report.payload,
            network: {
              ...report.payload.network,
              remote_client: {
                source: 'tailscale-status',
                state: 'offline',
                last_seen_seconds_ago: 6 * 3_600,
              },
            },
          },
        },
        samples,
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('Mac offline');
    expect(html).toContain('Seen 6h ago · GRD active · VA-API ready');
    expect(html).toContain('Looks good');
  });

  it('surfaces a current software-encode fallback', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report: {
          ...report,
          payload: {
            ...report.payload,
            services: {
              ...report.payload.services,
              gnome_remote_desktop_acceleration: {
                source: 'grd-current-invocation',
                state: 'software-fallback',
              },
            },
          },
        },
        samples,
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('GRD active · Software encode');
    expect(html).toContain('RDP graphics: Software encode');
    expect(html).toContain('Worth a look');
    expect(html).toContain(
      'GNOME Remote Desktop fell back from GPU acceleration.'
    );
  });

  it('surfaces route residue and unknown ownership without exposing IDs', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report: {
          ...report,
          payload: {
            ...report.payload,
            route_activity: {
              source: 'codex-route-leases-v2',
              active_routes: 2,
              active_jobs: 3,
              tagged_processes: 17,
              tagged_rss_bytes: 536_870_912,
              residue_jobs: 1,
              unknown_routes: 0,
              unknown_jobs: 2,
              tagged_resource_jobs: 3,
              tagged_memory_observed_jobs: 3,
              tagged_cpu_observed_jobs: 3,
              tagged_io_observed_jobs: 0,
              tagged_pressure_observed_jobs: 3,
              tagged_memory_current_bytes: 402_653_184,
              largest_tagged_job_memory_peak_bytes: 201_326_592,
              tagged_cpu_usage_usec: 2_500_000,
              tagged_io_read_bytes: null,
              tagged_io_write_bytes: null,
              tagged_cpu_pressure_some_usec: 198,
              tagged_memory_pressure_some_usec: 0,
              tagged_memory_pressure_full_usec: 0,
              tagged_io_pressure_some_usec: 0,
              tagged_io_pressure_full_usec: 0,
            },
          },
        },
        samples,
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('Worth a look');
    expect(html).toContain('1 agent job left process residue.');
    expect(html).toContain('2 agent route items need ownership inspection.');
    expect(html).toContain('1 residue · 2 unknown');
    expect(html).not.toContain('route_id');
  });

  it('shows chat-root and subagent process tags without identifiers', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report,
        samples,
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('Codex tags');
    expect(html).toContain('1 main · 3 agents · 5 jobs');
    expect(html).toContain('17 proc · 512 MiB memory');
    expect(html).not.toContain('agent_id');
    expect(html).not.toContain('route_id');
  });

  it('surfaces recovered crashes even when failed units returned to zero', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report: {
          ...report,
          payload: {
            ...report.payload,
            reliability: {
              source: 'journal-24h',
              window_hours: 24,
              crash_exits: 2,
              automatic_restarts: 3,
              truncated: false,
            },
          },
        },
        samples,
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('Worth a look');
    expect(html).toContain('2 service crashes recorded in the last 24 hours.');
    expect(html).toContain('Crashes · 24h: 2');
    expect(html).toContain('Auto restarts · 24h: 3');
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

  it('shows the seven-day Codex-state delta when history is available', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthDashboard, {
        report,
        samples: [
          {
            ...samples[0],
            checkedAt: new Date(
              Date.parse(checkedAt) - 8 * 86_400_000
            ).toISOString(),
            codexStateAllocatedBytes: 1_534_857_216,
          },
          ...samples,
        ],
        now: Date.parse(checkedAt) + 20 * 60_000,
      })
    );

    expect(html).toContain('+300 MiB / 7d');
  });
});
