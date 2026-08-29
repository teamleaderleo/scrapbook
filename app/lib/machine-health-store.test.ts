import { describe, expect, it } from 'vitest';

import {
  evaluateMachineHealth,
  machineHealthPayloadSchema,
} from './machine-health-store';
import { healthyMachineReport } from '@/tests/fixtures/machine-health';

describe('machine health contract', () => {
  it('accepts the bounded report and strips unknown fields at every level', () => {
    const parsed = machineHealthPayloadSchema.parse({
      ...healthyMachineReport,
      private_ip: 'must-not-survive',
      hygiene: {
        ...healthyMachineReport.hygiene,
        process_arguments: ['must-not-survive'],
      },
      route_activity: {
        ...healthyMachineReport.route_activity,
        route_id: 'must-not-survive',
      },
      process_tags: {
        ...healthyMachineReport.process_tags,
        route_id: 'must-not-survive',
        agent_id: 'must-not-survive',
      },
      process_coverage: {
        ...healthyMachineReport.process_coverage,
        process_identity: 'must-not-survive',
      },
    });

    expect(parsed).toEqual(healthyMachineReport);
  });

  it('defaults new hygiene counters when reading a pre-extension snapshot', () => {
    const {
      browser_rss_bytes: _browserRssBytes,
      rdp_connections: _rdpConnections,
      ...olderHygiene
    } = healthyMachineReport.hygiene;
    const parsed = machineHealthPayloadSchema.parse({
      ...healthyMachineReport,
      hygiene: olderHygiene,
    });

    expect(parsed.hygiene.browser_rss_bytes).toBe(0);
    expect(parsed.hygiene.rdp_connections).toBe(0);
  });

  it('accepts a snapshot from before reliability history was added', () => {
    const { reliability: _reliability, ...olderReport } = healthyMachineReport;
    const parsed = machineHealthPayloadSchema.parse(olderReport);

    expect(parsed.reliability).toBeUndefined();
  });

  it('accepts a snapshot from before remote client state was added', () => {
    const { remote_client: _remoteClient, ...olderNetwork } =
      healthyMachineReport.network;
    const {
      gnome_remote_desktop: _remoteDesktop,
      gnome_remote_desktop_acceleration: _remoteAcceleration,
      ...olderServices
    } = healthyMachineReport.services;
    const parsed = machineHealthPayloadSchema.parse({
      ...healthyMachineReport,
      network: olderNetwork,
      services: olderServices,
    });

    expect(parsed.network.remote_client).toBeUndefined();
    expect(parsed.services.gnome_remote_desktop).toBeUndefined();
    expect(parsed.services.gnome_remote_desktop_acceleration).toBeUndefined();
  });

  it('rejects peer detail and inconsistent unavailable remote state', () => {
    const parsed = machineHealthPayloadSchema.parse({
      ...healthyMachineReport,
      network: {
        ...healthyMachineReport.network,
        remote_client: {
          ...healthyMachineReport.network.remote_client,
          peer_name: 'must-not-survive',
          address: 'must-not-survive',
          relay_region: 'must-not-survive',
        },
      },
    });
    expect(parsed.network.remote_client).toEqual(
      healthyMachineReport.network.remote_client
    );
    expect(
      machineHealthPayloadSchema.safeParse({
        ...healthyMachineReport,
        network: {
          ...healthyMachineReport.network,
          remote_client: {
            source: 'unavailable',
            state: 'offline',
            last_seen_seconds_ago: 1,
          },
        },
      }).success
    ).toBe(false);
  });

  it('strips journal detail and rejects inconsistent acceleration state', () => {
    const parsed = machineHealthPayloadSchema.parse({
      ...healthyMachineReport,
      services: {
        ...healthyMachineReport.services,
        gnome_remote_desktop_acceleration: {
          source: 'grd-current-invocation',
          state: 'hardware-ready',
          journal_message: 'must-not-survive',
          invocation_id: 'must-not-survive',
        },
      },
    });
    expect(parsed.services.gnome_remote_desktop_acceleration).toEqual(
      healthyMachineReport.services.gnome_remote_desktop_acceleration
    );
    expect(
      machineHealthPayloadSchema.safeParse({
        ...healthyMachineReport,
        services: {
          ...healthyMachineReport.services,
          gnome_remote_desktop_acceleration: {
            source: 'unavailable',
            state: 'hardware-ready',
          },
        },
      }).success
    ).toBe(false);
  });

  it('accepts a snapshot from before route ownership was added', () => {
    const { route_activity: _routeActivity, ...olderReport } =
      healthyMachineReport;
    const parsed = machineHealthPayloadSchema.parse(olderReport);

    expect(parsed.route_activity).toBeUndefined();
  });

  it('accepts route ownership from before cgroup resources were added', () => {
    const parsed = machineHealthPayloadSchema.parse({
      ...healthyMachineReport,
      route_activity: {
        source: 'codex-route-leases-v2',
        active_routes: 2,
        active_jobs: 3,
        tagged_processes: 17,
        tagged_rss_bytes: 536_870_912,
        residue_jobs: 0,
        unknown_routes: 0,
        unknown_jobs: 0,
      },
    });

    expect(parsed.route_activity?.tagged_resource_jobs).toBeUndefined();
  });

  it('accepts a snapshot from before process coverage was added', () => {
    const { process_coverage: _ProcessCoverage, ...olderReport } =
      healthyMachineReport;
    const parsed = machineHealthPayloadSchema.parse(olderReport);

    expect(parsed.process_coverage).toBeUndefined();
  });

  it('accepts a snapshot from before process tags were added', () => {
    const { process_tags: _processTags, ...olderReport } = healthyMachineReport;
    const parsed = machineHealthPayloadSchema.parse(olderReport);

    expect(parsed.process_tags).toBeUndefined();
  });

  it('rejects inconsistent process tag aggregates', () => {
    expect(
      machineHealthPayloadSchema.safeParse({
        ...healthyMachineReport,
        process_tags: {
          ...healthyMachineReport.process_tags,
          tagged_processes:
            (healthyMachineReport.process_tags?.tagged_processes ?? 0) + 1,
        },
      }).success
    ).toBe(false);
  });

  it('does not accept numeric route counts from an unavailable source', () => {
    const unavailableWithCounts: unknown = {
      ...healthyMachineReport,
      route_activity: {
        ...healthyMachineReport.route_activity,
        source: 'unavailable',
      },
    };
    expect(
      machineHealthPayloadSchema.safeParse(unavailableWithCounts).success
    ).toBe(false);
  });

  it('does not accept process counts from an unavailable coverage source', () => {
    const unavailableWithCounts: unknown = {
      ...healthyMachineReport,
      process_coverage: {
        ...healthyMachineReport.process_coverage,
        source: 'unavailable',
      },
    };
    expect(
      machineHealthPayloadSchema.safeParse(unavailableWithCounts).success
    ).toBe(false);
  });

  it('rejects inconsistent process coverage counts', () => {
    expect(
      machineHealthPayloadSchema.safeParse({
        ...healthyMachineReport,
        process_coverage: {
          ...healthyMachineReport.process_coverage,
          scoped_processes: 19,
        },
      }).success
    ).toBe(false);
  });

  it('rejects a host name or payload shape outside the single-machine contract', () => {
    expect(
      machineHealthPayloadSchema.safeParse({
        ...healthyMachineReport,
        host: 'other-host',
      }).success
    ).toBe(false);
    expect(
      machineHealthPayloadSchema.safeParse({
        ...healthyMachineReport,
        memory: { used_percent: 101, total_gib: 32 },
      }).success
    ).toBe(false);
  });

  it('classifies operator thresholds without treating ordinary load as an incident', () => {
    const processTags = healthyMachineReport.process_tags;
    if (processTags?.source !== 'codex-route-hook-v1')
      throw new Error('Expected the process-tag fixture');

    expect(evaluateMachineHealth(healthyMachineReport)).toEqual({
      state: 'healthy',
      reasons: [],
    });
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        disk: { root_used_percent: 82, root_free_gib: 100 },
      }).state
    ).toBe('watch');
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        services: { ...healthyMachineReport.services, failed_user_units: 1 },
      }).state
    ).toBe('attention');
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        power: {
          ...healthyMachineReport.power,
          idle_suspend_ac: 'suspend',
        },
      }).state
    ).toBe('watch');
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        reliability: {
          ...healthyMachineReport.reliability!,
          crash_exits: 2,
          automatic_restarts: 3,
        },
      })
    ).toEqual({
      state: 'watch',
      reasons: ['2 service crashes recorded in the last 24 hours.'],
    });
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        route_activity: {
          source: 'codex-route-leases-v2',
          active_routes: 2,
          active_jobs: 3,
          tagged_processes: 17,
          tagged_rss_bytes: 536_870_912,
          residue_jobs: 1,
          unknown_routes: 1,
          unknown_jobs: 0,
        },
      })
    ).toEqual({
      state: 'watch',
      reasons: [
        '1 agent job left process residue.',
        '1 agent route item needs ownership inspection.',
      ],
    });
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        process_tags: {
          ...processTags,
          unknown_jobs: 2,
        },
      })
    ).toEqual({
      state: 'watch',
      reasons: ['2 Codex tags need inspection.'],
    });
    expect(
      evaluateMachineHealth({
        ...healthyMachineReport,
        services: {
          ...healthyMachineReport.services,
          gnome_remote_desktop_acceleration: {
            source: 'grd-current-invocation',
            state: 'software-fallback',
          },
        },
      })
    ).toEqual({
      state: 'watch',
      reasons: ['GNOME Remote Desktop fell back from GPU acceleration.'],
    });
  });
});
