import { randomUUID } from 'node:crypto';

import { client } from '@/app/lib/db/db';
import { z } from 'zod';

const percent = z.number().finite().min(0).max(100);
const nonnegative = z.number().finite().min(0);
const nullableNonnegative = nonnegative.nullable();
const nonnegativeInteger = z.number().int().min(0);
const codexCounter = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const codexRuntimeClassSchema = z.object({
  processes: nonnegativeInteger,
  rss_bytes: nonnegativeInteger,
  pss_bytes: nonnegativeInteger.nullable(),
  swap_bytes: nonnegativeInteger.nullable(),
});
export const codexTokenSourceSchema = z.enum(['big-red', 'macbook-air']);
export const codexUsageWindowSchema = z
  .object({
    source: z.literal('session-jsonl'),
    window_started_at: z.string().datetime({ offset: true }),
    window_ended_at: z.string().datetime({ offset: true }),
    input_tokens: codexCounter,
    cached_input_tokens: codexCounter,
    cache_write_input_tokens: codexCounter,
    output_tokens: codexCounter,
    reasoning_output_tokens: codexCounter,
    total_tokens: codexCounter,
    model_calls: codexCounter,
    active_routes: codexCounter,
    session_fingerprints: z
      .array(z.string().regex(/^[0-9a-f]{32}$/))
      .max(1_024)
      .optional(),
    fingerprints_complete: z.boolean().optional(),
  })
  .superRefine((usage, context) => {
    const start = Date.parse(usage.window_started_at);
    const end = Date.parse(usage.window_ended_at);
    if (start % (60 * 60 * 1_000) !== 0 || end - start !== 60 * 60 * 1_000)
      context.addIssue({
        code: 'custom',
        message: 'Codex usage windows must be exact UTC hours',
      });
    if (usage.cached_input_tokens > usage.input_tokens)
      context.addIssue({
        code: 'custom',
        message: 'Cached input cannot exceed input tokens',
      });
    if (usage.reasoning_output_tokens > usage.output_tokens)
      context.addIssue({
        code: 'custom',
        message: 'Reasoning output cannot exceed output tokens',
      });
  });

export const codexTokenReportSchema = z
  .object({
    schema_version: z.literal(1),
    source: codexTokenSourceSchema,
    collected_at: z.string().datetime({ offset: true }),
    windows: z.array(codexUsageWindowSchema).min(1).max(720),
  })
  .superRefine((report, context) => {
    const starts = report.windows.map(window =>
      Date.parse(window.window_started_at)
    );
    if (new Set(starts).size !== starts.length)
      context.addIssue({
        code: 'custom',
        message: 'Codex usage windows must be unique within a report',
      });
    for (const [index, window] of report.windows.entries()) {
      if (window.fingerprints_complete !== true || !window.session_fingerprints)
        context.addIssue({
          code: 'custom',
          path: ['windows', index, 'fingerprints_complete'],
          message: 'Cross-device reports require complete session fingerprints',
        });
      if (
        window.session_fingerprints &&
        new Set(window.session_fingerprints).size !==
          window.session_fingerprints.length
      )
        context.addIssue({
          code: 'custom',
          path: ['windows', index, 'session_fingerprints'],
          message: 'Session fingerprints must be unique within a window',
        });
    }
  });
const routeResourceFields = {
  tagged_resource_jobs: nonnegativeInteger.nullable().optional(),
  tagged_memory_observed_jobs: nonnegativeInteger.nullable().optional(),
  tagged_cpu_observed_jobs: nonnegativeInteger.nullable().optional(),
  tagged_io_observed_jobs: nonnegativeInteger.nullable().optional(),
  tagged_pressure_observed_jobs: nonnegativeInteger.nullable().optional(),
  tagged_memory_current_bytes: nonnegativeInteger.nullable().optional(),
  largest_tagged_job_memory_peak_bytes: nonnegativeInteger
    .nullable()
    .optional(),
  tagged_cpu_usage_usec: nonnegativeInteger.nullable().optional(),
  tagged_io_read_bytes: nonnegativeInteger.nullable().optional(),
  tagged_io_write_bytes: nonnegativeInteger.nullable().optional(),
  tagged_cpu_pressure_some_usec: nonnegativeInteger.nullable().optional(),
  tagged_memory_pressure_some_usec: nonnegativeInteger.nullable().optional(),
  tagged_memory_pressure_full_usec: nonnegativeInteger.nullable().optional(),
  tagged_io_pressure_some_usec: nonnegativeInteger.nullable().optional(),
  tagged_io_pressure_full_usec: nonnegativeInteger.nullable().optional(),
};
const unavailableRouteResourceFields = {
  tagged_resource_jobs: z.null().optional(),
  tagged_memory_observed_jobs: z.null().optional(),
  tagged_cpu_observed_jobs: z.null().optional(),
  tagged_io_observed_jobs: z.null().optional(),
  tagged_pressure_observed_jobs: z.null().optional(),
  tagged_memory_current_bytes: z.null().optional(),
  largest_tagged_job_memory_peak_bytes: z.null().optional(),
  tagged_cpu_usage_usec: z.null().optional(),
  tagged_io_read_bytes: z.null().optional(),
  tagged_io_write_bytes: z.null().optional(),
  tagged_cpu_pressure_some_usec: z.null().optional(),
  tagged_memory_pressure_some_usec: z.null().optional(),
  tagged_memory_pressure_full_usec: z.null().optional(),
  tagged_io_pressure_some_usec: z.null().optional(),
  tagged_io_pressure_full_usec: z.null().optional(),
};
const serviceState = z.enum(['active', 'inactive', 'missing', 'unknown']);
const routerServiceState = z.enum(['running', 'inactive', 'unknown']);
const idleSleepAction = z.enum([
  'nothing',
  'suspend',
  'hibernate',
  'shutdown',
  'unknown',
]);
const remoteClient = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('tailscale-status'),
    state: z.enum(['offline', 'online-idle', 'direct', 'relay', 'unknown']),
    last_seen_seconds_ago: nonnegativeInteger.nullable(),
    transport_probe: z
      .object({
        source: z.literal('tailscale-ping'),
        path: z.enum(['direct', 'relay', 'peer-relay']),
        rtt_ms: z.number().finite().nonnegative().max(60_000),
        samples: z.literal(1),
      })
      .optional(),
  }),
  z.object({
    source: z.literal('unavailable'),
    state: z.literal('unavailable'),
    last_seen_seconds_ago: z.null(),
  }),
]);
const remoteAcceleration = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('grd-current-invocation'),
    state: z.enum([
      'hardware-ready',
      'software-fallback',
      'awaiting-session',
      'unknown',
    ]),
  }),
  z.object({
    source: z.literal('unavailable'),
    state: z.literal('unavailable'),
  }),
]);
const remoteSessions = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('grd-journal-24h'),
    window_hours: z.literal(24),
    session_endings: nonnegativeInteger,
    transport_endings: nonnegativeInteger,
    user_logoffs: nonnegativeInteger,
    server_disconnects: nonnegativeInteger,
    admission_blocks: nonnegativeInteger.optional(),
    truncated: z.boolean(),
  }),
  z.object({
    source: z.literal('unavailable'),
    window_hours: z.literal(24),
    session_endings: z.null(),
    transport_endings: z.null(),
    user_logoffs: z.null(),
    server_disconnects: z.null(),
    admission_blocks: z.null().optional(),
    truncated: z.boolean(),
  }),
]);
const panelState = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('sysfs-backlight'),
    state: z.enum(['on', 'off', 'unknown']),
    actual_brightness_percent: z.number().finite().min(0).max(100),
  }),
  z.object({
    source: z.literal('unavailable'),
    state: z.literal('unavailable'),
    actual_brightness_percent: z.null(),
  }),
]);
const desktopState = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('gnome-polish-live-v2'),
    gnome_shell: z.string().regex(/^[0-9]+(?:\.[0-9]+){1,3}$/),
    pixel_width: z.number().int().min(320).max(16_384),
    pixel_height: z.number().int().min(240).max(16_384),
    refresh_hz: z.number().finite().min(1).max(1_000),
    logical_scale: z.number().finite().min(0.5).max(4),
    screen_shield_active: z.boolean(),
    animations_enabled: z.boolean(),
    screen_share_mode: z.enum(['mirror-primary', 'extend']),
    wallpaper_references_complete: z.boolean().optional(),
    panel: panelState.optional(),
  }),
  z.object({
    source: z.literal('unavailable'),
    gnome_shell: z.null(),
    pixel_width: z.null(),
    pixel_height: z.null(),
    refresh_hz: z.null(),
    logical_scale: z.null(),
    screen_shield_active: z.null(),
    animations_enabled: z.null(),
    screen_share_mode: z.null(),
    wallpaper_references_complete: z.null().optional(),
    panel: panelState.optional(),
  }),
]);
const reliabilityCounts = z.object({
  crash_exits: nonnegativeInteger,
  automatic_restarts: nonnegativeInteger,
});
const reliabilityState = z
  .object({
    source: z.enum(['journal-24h', 'unavailable']),
    window_hours: z.literal(24),
    crash_exits: nonnegativeInteger,
    automatic_restarts: nonnegativeInteger,
    breakdown: z
      .object({
        desktop_search: reliabilityCounts,
        other: reliabilityCounts,
      })
      .optional(),
    truncated: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!value.breakdown) return;
    if (
      value.breakdown.desktop_search.crash_exits +
        value.breakdown.other.crash_exits !==
        value.crash_exits ||
      value.breakdown.desktop_search.automatic_restarts +
        value.breakdown.other.automatic_restarts !==
        value.automatic_restarts
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['breakdown'],
        message: 'Reliability breakdown does not reconcile with totals',
      });
  });
const berylFanState = z
  .object({
    service: routerServiceState,
    policy_enabled: z.boolean(),
    policy_temperature_c: z.number().int().min(0).max(150),
    policy_warning_c: z.number().int().min(0).max(150),
    pwm_current_state: nonnegativeInteger.max(1_000_000),
    pwm_max_state: z.number().int().min(1).max(1_000_000),
    cpu_cooling_current_state: nonnegativeInteger.max(1_000_000),
    cpu_cooling_max_state: z.number().int().min(1).max(1_000_000),
  })
  .refine(
    value =>
      value.pwm_current_state <= value.pwm_max_state &&
      value.cpu_cooling_current_state <= value.cpu_cooling_max_state,
    { message: 'Beryl cooling states cannot exceed their maxima' }
  );
const berylState = z.union([
  z.object({ source: z.literal('unavailable') }),
  z.object({
    source: z.literal('big-red-connectivity-check-v1'),
    ssh: z.literal('unavailable'),
  }),
  z
    .object({
      source: z.literal('big-red-connectivity-check-v1'),
      ssh: z.literal('available'),
      tailscale_service: routerServiceState,
      openclash_service: routerServiceState,
      netifyd_service: routerServiceState,
      tailscaled_processes: nonnegativeInteger.max(1_024),
      clash_processes: nonnegativeInteger.max(1_024),
      netifyd_processes: nonnegativeInteger.max(1_024),
      tailscaled_rss_kib: nonnegativeInteger.max(2 ** 31),
      clash_rss_kib: nonnegativeInteger.max(2 ** 31),
      mem_available_kib: nonnegativeInteger.max(2 ** 31),
      uptime_seconds: codexCounter,
      oom_kills_observed_log: nonnegativeInteger.max(1_000_000),
      latest_oom_age_seconds_observed_log: nonnegativeInteger.nullable(),
      soc_temp_millic: z.number().int().min(0).max(150_000),
      fan: berylFanState.nullable(),
    })
    .refine(
      value =>
        value.latest_oom_age_seconds_observed_log === null ||
        (value.oom_kills_observed_log > 0 &&
          value.latest_oom_age_seconds_observed_log <= value.uptime_seconds),
      { message: 'Beryl retained-log OOM evidence is inconsistent' }
    ),
]);
const berylLinkState = z.union([
  z.object({ source: z.literal('unavailable') }),
  z
    .object({
      source: z.literal('big-red-connectivity-check-v1'),
      wifi: z
        .object({
          signal_dbm: z.number().int().min(-150).max(0).nullable(),
          frequency_mhz: z.number().int().min(2_000).max(8_000).nullable(),
          channel_width_mhz: z.number().int().min(1).max(320).nullable(),
          rx_bitrate_mbps: z.number().finite().min(0).max(100_000).nullable(),
          tx_bitrate_mbps: z.number().finite().min(0).max(100_000).nullable(),
        })
        .nullable(),
      gateway: z
        .object({
          samples_sent: z.literal(5),
          samples_received: z.number().int().min(0).max(5),
          packet_loss_percent: percent,
          rtt_avg_ms: z.number().finite().min(0).max(60_000).nullable(),
          rtt_mdev_ms: z.number().finite().min(0).max(60_000).nullable(),
        })
        .nullable(),
    })
    .superRefine((value, context) => {
      const gateway = value.gateway;
      if (!gateway) return;
      const expectedLoss =
        ((gateway.samples_sent - gateway.samples_received) * 100) /
        gateway.samples_sent;
      if (Math.abs(gateway.packet_loss_percent - expectedLoss) > 0.01)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gateway', 'packet_loss_percent'],
          message: 'Beryl gateway packet counts and loss are inconsistent',
        });
      const hasRtt =
        gateway.rtt_avg_ms !== null && gateway.rtt_mdev_ms !== null;
      if (hasRtt !== gateway.samples_received > 0)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gateway', 'rtt_avg_ms'],
          message: 'Beryl gateway RTT is inconsistent with received replies',
        });
    }),
]);

export const machineHealthPayloadSchema = z.object({
  schema_version: z.literal(1),
  host: z.literal('big-red'),
  checked_at: z.string().datetime({ offset: true }),
  uptime_seconds: nonnegativeInteger,
  load: z.object({
    one: nonnegative,
    five: nonnegative,
    fifteen: nonnegative,
    logical_cpus: z.number().int().min(1).max(1_024),
  }),
  cpu: z.object({
    used_percent: percent,
  }),
  memory: z
    .object({
      used_percent: percent,
      total_gib: nonnegative,
      swap_used_gib: nonnegative.optional(),
      swap_total_gib: nonnegative.optional(),
    })
    .superRefine((value, context) => {
      const hasUsed = value.swap_used_gib !== undefined;
      const hasTotal = value.swap_total_gib !== undefined;
      if (hasUsed !== hasTotal) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'swap usage and capacity must be reported together',
        });
      } else if (
        value.swap_used_gib !== undefined &&
        value.swap_total_gib !== undefined &&
        value.swap_used_gib > value.swap_total_gib
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'swap usage cannot exceed capacity',
        });
      }
    }),
  disk: z.object({
    root_used_percent: percent,
    root_free_gib: nonnegative,
  }),
  temperature: z.object({
    peak_sensor_c: z.number().finite().min(-20).max(150).nullable(),
  }),
  graphics: z.object({
    clock_mhz: nullableNonnegative,
    max_clock_mhz: nullableNonnegative,
  }),
  activity: z
    .object({
      source: z.enum(['sysstat-10m', 'point']),
      window_minutes: z.number().int().min(0).max(180),
      sample_count: z.number().int().min(1).max(18),
      cpu_peak_percent: percent,
      core_average_percent: z
        .array(percent)
        .min(1)
        .max(256)
        .nullable()
        .optional(),
      core_peak_percent: z.array(percent).min(1).max(256).nullable().optional(),
      memory_peak_percent: percent,
      cpu_pressure_some_percent: percent.nullable(),
      memory_pressure_full_percent: percent.nullable(),
      io_pressure_full_percent: percent.nullable(),
      disk_read_mib_s: nullableNonnegative,
      disk_write_mib_s: nullableNonnegative,
      network_peak_mib_s: nullableNonnegative.optional(),
      disk_peak_mib_s: nullableNonnegative.optional(),
    })
    .superRefine((value, context) => {
      const averages = value.core_average_percent;
      const peaks = value.core_peak_percent;
      if ((averages == null) !== (peaks == null)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'per-core averages and peaks must be reported together',
        });
        return;
      }
      if (!averages || !peaks) return;
      if (averages.length !== peaks.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'per-core averages and peaks must have the same length',
        });
        return;
      }
      averages.forEach((average, index) => {
        if (average > peaks[index])
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['core_peak_percent', index],
            message: 'per-core peak cannot be below its average',
          });
      });
    }),
  codex_usage: z
    .union([
      codexUsageWindowSchema,
      z.object({
        source: z.literal('unavailable'),
        window_started_at: z.string().datetime({ offset: true }),
        window_ended_at: z.string().datetime({ offset: true }),
        input_tokens: z.literal(0),
        cached_input_tokens: z.literal(0),
        cache_write_input_tokens: z.literal(0),
        output_tokens: z.literal(0),
        reasoning_output_tokens: z.literal(0),
        total_tokens: z.literal(0),
        model_calls: z.literal(0),
        active_routes: z.literal(0),
        session_fingerprints: z.array(z.never()).optional(),
        fingerprints_complete: z.boolean().optional(),
      }),
    ])
    .optional(),
  route_activity: z
    .discriminatedUnion('source', [
      z.object({
        source: z.literal('codex-route-leases-v2'),
        active_routes: nonnegativeInteger,
        active_jobs: nonnegativeInteger,
        tagged_processes: nonnegativeInteger,
        tagged_rss_bytes: nonnegativeInteger,
        residue_jobs: nonnegativeInteger,
        unknown_routes: nonnegativeInteger,
        unknown_jobs: nonnegativeInteger,
        ...routeResourceFields,
      }),
      z.object({
        source: z.literal('unavailable'),
        active_routes: z.null(),
        active_jobs: z.null(),
        tagged_processes: z.null(),
        tagged_rss_bytes: z.null(),
        residue_jobs: z.null(),
        unknown_routes: z.null(),
        unknown_jobs: z.null(),
        ...unavailableRouteResourceFields,
      }),
    ])
    .optional(),
  process_tags: z
    .discriminatedUnion('source', [
      z.object({
        source: z.literal('codex-route-hook-v1'),
        active_routes: nonnegativeInteger,
        active_main_roots: nonnegativeInteger,
        active_subagents: nonnegativeInteger,
        active_jobs: nonnegativeInteger,
        main_root_jobs: nonnegativeInteger,
        subagent_jobs: nonnegativeInteger,
        tagged_processes: nonnegativeInteger,
        main_root_processes: nonnegativeInteger,
        subagent_processes: nonnegativeInteger,
        tagged_memory_current_bytes: nonnegativeInteger,
        main_root_memory_current_bytes: nonnegativeInteger,
        subagent_memory_current_bytes: nonnegativeInteger,
        unknown_jobs: nonnegativeInteger,
      }),
      z.object({
        source: z.literal('unavailable'),
        availability_reason: z
          .enum([
            'helper-missing',
            'helper-failed',
            'schema-mismatch',
            'invalid-receipt',
          ])
          .optional(),
        active_routes: z.null(),
        active_main_roots: z.null(),
        active_subagents: z.null(),
        active_jobs: z.null(),
        main_root_jobs: z.null(),
        subagent_jobs: z.null(),
        tagged_processes: z.null(),
        main_root_processes: z.null(),
        subagent_processes: z.null(),
        tagged_memory_current_bytes: z.null(),
        main_root_memory_current_bytes: z.null(),
        subagent_memory_current_bytes: z.null(),
        unknown_jobs: z.null(),
      }),
    ])
    .superRefine((value, context) => {
      if (value.source !== 'codex-route-hook-v1') return;
      if (
        value.active_routes > value.active_jobs ||
        value.active_main_roots > value.active_routes ||
        value.active_main_roots > value.main_root_jobs ||
        value.active_subagents > value.subagent_jobs ||
        value.main_root_jobs + value.subagent_jobs !== value.active_jobs ||
        value.main_root_processes + value.subagent_processes !==
          value.tagged_processes ||
        value.main_root_memory_current_bytes +
          value.subagent_memory_current_bytes !==
          value.tagged_memory_current_bytes
      )
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Codex process tag aggregates are inconsistent',
        });
    })
    .optional(),
  process_coverage: z
    .union([
      z
        .object({
          source: z.literal('codex-process-coverage-v1'),
          observed_at: z.string().datetime({ offset: true }),
          scope_evidence: z.enum(['complete', 'partial']),
          discoverable_roots: nonnegativeInteger,
          discoverable_processes: nonnegativeInteger,
          scoped_processes: nonnegativeInteger,
          discoverable_rss_bytes: nonnegativeInteger.nullable(),
          evidence_errors: nonnegativeInteger,
        })
        .refine(
          value =>
            value.discoverable_roots <= value.discoverable_processes &&
            value.scoped_processes <= value.discoverable_processes,
          { message: 'process coverage counts are inconsistent' }
        ),
      z.object({
        source: z.literal('unavailable'),
        observed_at: z.null(),
        scope_evidence: z.null(),
        discoverable_roots: z.null(),
        discoverable_processes: z.null(),
        scoped_processes: z.null(),
        discoverable_rss_bytes: z.null(),
        evidence_errors: z.null(),
      }),
    ])
    .optional(),
  codex_state: z
    .union([
      z
        .object({
          source: z.literal('codex-state-inventory-v1'),
          observed_at: z.string().datetime({ offset: true }),
          installed_build: z.string().regex(/^[0-9A-Za-z.+:~_-]{1,64}$/),
          scan_duration_ms: nonnegativeInteger.max(60_000),
          snapshot_evidence: z.enum(['complete', 'partial']),
          allocated_bytes: nonnegativeInteger,
          file_count: nonnegativeInteger,
          class_count: nonnegativeInteger,
          relevant_process_count: nonnegativeInteger,
          active_bytes: nonnegativeInteger,
          active_files: nonnegativeInteger,
          active_classes: nonnegativeInteger,
          authoritative_bytes: nonnegativeInteger,
          authoritative_files: nonnegativeInteger,
          authoritative_classes: nonnegativeInteger,
          manifest_referenced_bytes: nonnegativeInteger,
          manifest_referenced_files: nonnegativeInteger,
          manifest_referenced_classes: nonnegativeInteger,
          unknown_bytes: nonnegativeInteger,
          unknown_files: nonnegativeInteger,
          unknown_classes: nonnegativeInteger,
          reconstructible_bytes: z.literal(0),
          reclaimable_bytes: z.literal(0),
          retention_authority: z.literal(false),
        })
        .superRefine((value, context) => {
          if (
            value.active_bytes +
              value.authoritative_bytes +
              value.manifest_referenced_bytes +
              value.unknown_bytes !==
              value.allocated_bytes ||
            value.active_files +
              value.authoritative_files +
              value.manifest_referenced_files +
              value.unknown_files !==
              value.file_count ||
            value.active_classes +
              value.authoritative_classes +
              value.manifest_referenced_classes +
              value.unknown_classes !==
              value.class_count
          )
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Codex state aggregates are inconsistent',
            });
        }),
      z.object({
        source: z.literal('unavailable'),
        observed_at: z.null(),
        installed_build: z.null(),
        scan_duration_ms: z.null(),
        snapshot_evidence: z.null(),
        allocated_bytes: z.null(),
        file_count: z.null(),
        class_count: z.null(),
        relevant_process_count: z.null(),
        active_bytes: z.null(),
        active_files: z.null(),
        active_classes: z.null(),
        authoritative_bytes: z.null(),
        authoritative_files: z.null(),
        authoritative_classes: z.null(),
        manifest_referenced_bytes: z.null(),
        manifest_referenced_files: z.null(),
        manifest_referenced_classes: z.null(),
        unknown_bytes: z.null(),
        unknown_files: z.null(),
        unknown_classes: z.null(),
        reconstructible_bytes: z.null(),
        reclaimable_bytes: z.null(),
        retention_authority: z.null(),
      }),
    ])
    .optional(),
  desktop: desktopState.optional(),
  services: z.object({
    failed_system_units: nonnegativeInteger,
    failed_user_units: nonnegativeInteger,
    ssh: serviceState,
    tailscale: serviceState,
    network_manager: serviceState,
    time_sync: serviceState,
    gnome_remote_desktop: serviceState.optional(),
    gnome_remote_desktop_acceleration: remoteAcceleration.optional(),
    gnome_remote_desktop_sessions: remoteSessions.optional(),
  }),
  network: z.object({
    connectivity: z.enum(['full', 'limited', 'portal', 'none', 'unknown']),
    tailscale_backend: z.enum(['running', 'needs-login', 'stopped', 'unknown']),
    tailscale_self_online: z.boolean().nullable(),
    remote_client: remoteClient.optional(),
    rx_mib_s: nonnegative,
    tx_mib_s: nonnegative,
  }),
  beryl: berylState.optional(),
  beryl_link: berylLinkState.optional(),
  power: z.object({
    profile: z.enum(['performance', 'balanced', 'power-saver', 'unknown']),
    idle_suspend_ac: idleSleepAction,
    idle_suspend_battery: idleSleepAction,
    hibernate_targets_masked: z.boolean(),
    on_ac: z.boolean().nullable(),
    battery_percent: percent.nullable(),
    battery_state: z.enum([
      'full',
      'charging',
      'discharging',
      'not-charging',
      'unknown',
    ]),
  }),
  hygiene: z.object({
    browser_roots: nonnegativeInteger,
    browser_rss_bytes: nonnegativeInteger.default(0),
    codex_workers: nonnegativeInteger,
    codex_runtime: z
      .object({
        source: z.literal('codex-runtime-tree-v1'),
        control_roots: nonnegativeInteger,
        processes: nonnegativeInteger,
        code_mode_hosts: nonnegativeInteger,
        mcp_servers: nonnegativeInteger,
        rss_bytes: nonnegativeInteger,
        pss_bytes: nonnegativeInteger.nullable(),
        swap_bytes: nonnegativeInteger.nullable(),
        memory_errors: nonnegativeInteger,
        process_classes: z
          .object({
            control: codexRuntimeClassSchema,
            code_mode: codexRuntimeClassSchema,
            mcp: codexRuntimeClassSchema,
            other: codexRuntimeClassSchema,
          })
          .optional(),
      })
      .superRefine((runtime, context) => {
        if (
          (runtime.memory_errors === 0) !== (runtime.pss_bytes !== null) ||
          (runtime.memory_errors === 0) !== (runtime.swap_bytes !== null)
        )
          context.addIssue({
            code: 'custom',
            message: 'Codex runtime memory completeness is inconsistent',
          });
        if (!runtime.process_classes) return;
        const classes = Object.values(runtime.process_classes);
        if (
          classes.reduce((total, value) => total + value.processes, 0) !==
            runtime.processes ||
          classes.reduce((total, value) => total + value.rss_bytes, 0) !==
            runtime.rss_bytes ||
          runtime.process_classes.control.processes < runtime.control_roots ||
          runtime.process_classes.code_mode.processes !==
            runtime.code_mode_hosts ||
          runtime.process_classes.mcp.processes !== runtime.mcp_servers
        )
          context.addIssue({
            code: 'custom',
            message: 'Codex runtime process-class totals are inconsistent',
          });

        for (const field of ['pss_bytes', 'swap_bytes'] as const) {
          const total = runtime[field];
          const values = classes.map(value => value[field]);
          if (total === null) {
            if (values.some(value => value !== null))
              context.addIssue({
                code: 'custom',
                message: `Codex runtime ${field} classes must fail closed`,
              });
          } else if (
            values.some(value => value === null) ||
            values.reduce<number>(
              (sum, value) => sum + (value === null ? 0 : value),
              0
            ) !== total
          )
            context.addIssue({
              code: 'custom',
              message: `Codex runtime ${field} class totals are inconsistent`,
            });
        }
      })
      .optional(),
    unexpected_dev_listeners: nonnegativeInteger,
    rdp_connections: nonnegativeInteger.default(0),
  }),
  reliability: reliabilityState.optional(),
  build_state: z
    .object({
      source: z.enum(['filesystem', 'unavailable']),
      total_gib: nullableNonnegative,
      target_gib: nullableNonnegative,
      largest_target_gib: nullableNonnegative.optional(),
      median_target_gib: nullableNonnegative.optional(),
      glaeda_cache_gib: nullableNonnegative,
      target_count: nonnegativeInteger.nullable(),
      active_build_processes: nonnegativeInteger.nullable(),
      hot_run: z
        .union([
          z
            .object({
              source: z.literal('glaeda-hot-run-observation-v2'),
              completeness: z.literal('complete'),
              state_count: nonnegativeInteger.max(1_024),
              logical_bytes: codexCounter,
              allocated_bytes: codexCounter,
              reclaimable_count: nonnegativeInteger,
              reclaimable_allocated_bytes: codexCounter,
              problems: z.array(z.never()).length(0),
            })
            .refine(
              value =>
                value.reclaimable_count <= value.state_count &&
                value.reclaimable_allocated_bytes <= value.allocated_bytes,
              { message: 'Glaeda hot-run aggregates are inconsistent' }
            ),
          z.object({
            source: z.literal('glaeda-hot-run-observation-v2'),
            completeness: z.literal('partial'),
            state_count: nonnegativeInteger.max(1_024),
            logical_bytes: z.null(),
            allocated_bytes: z.null(),
            reclaimable_count: z.null(),
            reclaimable_allocated_bytes: z.null(),
            problems: z
              .array(z.enum(['permission_denied', 'unsupported_node']))
              .min(1)
              .max(2)
              .refine(values => new Set(values).size === values.length),
          }),
        ])
        .nullable()
        .optional(),
    })
    .optional(),
});

export type MachineHealthPayload = z.infer<typeof machineHealthPayloadSchema>;
export type CodexTokenSource = z.infer<typeof codexTokenSourceSchema>;
export type CodexUsageWindow = z.infer<typeof codexUsageWindowSchema>;
export type CodexTokenReport = z.infer<typeof codexTokenReportSchema>;

export type MachineHealthSample = {
  checkedAt: string;
  panelOn: boolean | null;
  cpuUsedPercent: number;
  rootUsedPercent: number;
  memoryUsedPercent: number;
  loadPerCpu: number;
  peakSensorTemperatureC: number | null;
  graphicsClockMhz: number | null;
  networkRxMibS: number;
  networkTxMibS: number;
  diskReadMibS: number | null;
  diskWriteMibS: number | null;
  pressurePercent: number | null;
  coreAveragePercent?: number[] | null;
  corePeakPercent?: number[] | null;
  networkPeakMibS?: number | null;
  diskPeakMibS?: number | null;
  activitySource: MachineHealthPayload['activity']['source'];
  activitySampleCount: number;
  activityWindowMinutes: number;
  uptimeSeconds: number;
  browserRoots: number;
  browserRssBytes: number;
  codexWorkers: number;
  codexRuntimeProcesses: number | null;
  codexRuntimePssBytes: number | null;
  failedUnits: number;
  unexpectedDevListeners: number;
  rdpConnections: number;
  remoteTransportPath: 'direct' | 'relay' | 'peer-relay' | null;
  remoteRttMs: number | null;
  codexUsageWindowStartedAt: string | null;
  codexInputTokens: number | null;
  codexCachedInputTokens: number | null;
  codexCacheWriteInputTokens: number | null;
  codexOutputTokens: number | null;
  codexReasoningOutputTokens: number | null;
  codexTotalTokens: number | null;
  codexModelCalls: number | null;
  codexActiveRoutes: number | null;
  routeActiveRoutes: number | null;
  routeActiveJobs: number | null;
  routeTaggedProcesses: number | null;
  routeTaggedRssBytes: number | null;
  routeTaggedMemoryBytes: number | null;
  routeResidueJobs: number | null;
  routeUnknownCount: number | null;
  codexStateAllocatedBytes: number | null;
  buildStateGib: number | null;
  buildTargetCount: number | null;
  activeBuildProcesses: number | null;
};

export type StoredMachineHealth = {
  host: 'big-red';
  payload: MachineHealthPayload;
  checkedAt: string;
  updatedAt: string;
};

export type CodexTokenSample = {
  source: CodexTokenSource;
  accountingState: 'counted' | 'overlap-skipped' | 'unverified-skipped';
  windowStartedAt: string;
  windowEndedAt: string;
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
  modelCalls: number;
  activeRoutes: number;
};

export type MachineHealthReadResult =
  | {
      status: 'ok';
      report: StoredMachineHealth;
      samples: MachineHealthSample[];
      codexSamples: CodexTokenSample[];
      observedAt: string;
    }
  | { status: 'empty' }
  | { status: 'configuration-error'; message: string; requestId: string }
  | { status: 'error'; message: string; requestId: string };

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Number(value))
  )
    return Number(value);
  return fallback;
}

export function panelOnSample(payload: MachineHealthPayload) {
  const panel = payload.desktop?.panel;
  if (panel?.source !== 'sysfs-backlight') return null;
  if (panel.state === 'on') return true;
  if (panel.state === 'off') return false;
  return null;
}

export function evaluateMachineHealth(payload: MachineHealthPayload) {
  const failedUnits =
    payload.services.failed_system_units + payload.services.failed_user_units;
  const reasons: string[] = [];

  if (payload.disk.root_used_percent >= 90)
    reasons.push('Root disk is at 90% or more.');
  else if (payload.disk.root_used_percent >= 80)
    reasons.push('Root disk is at 80% or more.');
  if (failedUnits > 0)
    reasons.push(
      `${failedUnits} systemd unit${failedUnits === 1 ? '' : 's'} failed.`
    );
  if (payload.memory.used_percent >= 90)
    reasons.push('Memory use is at 90% or more.');
  if (payload.network.connectivity !== 'full')
    reasons.push(
      `NetworkManager reports ${payload.network.connectivity} connectivity.`
    );
  if (payload.network.tailscale_backend !== 'running')
    reasons.push('Tailscale is not in the running state.');
  if (payload.beryl?.source === 'unavailable')
    reasons.push('Beryl diagnostics are unavailable.');
  if (
    payload.beryl?.source === 'big-red-connectivity-check-v1' &&
    payload.beryl.ssh === 'unavailable'
  )
    reasons.push('Beryl did not answer the bounded SSH health probe.');
  if (
    payload.beryl?.source === 'big-red-connectivity-check-v1' &&
    payload.beryl.ssh === 'available'
  ) {
    if (
      payload.beryl.tailscale_service !== 'running' ||
      payload.beryl.tailscaled_processes !== 1
    )
      reasons.push('Beryl Tailscale is outside its expected service shape.');
    if (
      payload.beryl.openclash_service !== 'running' ||
      payload.beryl.clash_processes !== 1
    )
      reasons.push('Beryl OpenClash is outside its expected service shape.');
    if (
      payload.beryl.netifyd_service !== 'inactive' ||
      payload.beryl.netifyd_processes !== 0
    )
      reasons.push('Beryl Netify is unexpectedly active.');
    if (payload.beryl.fan?.service !== undefined) {
      if (
        payload.beryl.fan.service !== 'running' ||
        !payload.beryl.fan.policy_enabled
      )
        reasons.push('Beryl fan policy is not active.');
      if (payload.beryl.fan.cpu_cooling_current_state > 0)
        reasons.push('Beryl is applying CPU thermal cooling.');
    }
    if (
      payload.beryl.oom_kills_observed_log > 0 &&
      payload.beryl.latest_oom_age_seconds_observed_log !== null &&
      payload.beryl.latest_oom_age_seconds_observed_log < 24 * 60 * 60
    )
      reasons.push(
        'Beryl recorded an out-of-memory kill in the last 24 hours.'
      );
  }
  if (
    payload.beryl_link?.source === 'big-red-connectivity-check-v1' &&
    payload.beryl_link.gateway !== null &&
    payload.beryl_link.gateway.packet_loss_percent > 0
  )
    reasons.push(
      `Beryl gateway point sample lost ${payload.beryl_link.gateway.packet_loss_percent}% of its five packets.`
    );
  if (
    payload.services.gnome_remote_desktop !== undefined &&
    payload.services.gnome_remote_desktop !== 'active'
  )
    reasons.push('GNOME Remote Desktop is not active.');
  if (
    payload.services.gnome_remote_desktop_acceleration?.source ===
      'grd-current-invocation' &&
    payload.services.gnome_remote_desktop_acceleration.state ===
      'software-fallback'
  )
    reasons.push('GNOME Remote Desktop fell back from GPU acceleration.');
  if (
    payload.desktop?.source === 'gnome-polish-live-v2' &&
    payload.desktop.wallpaper_references_complete === false
  )
    reasons.push('Configured wallpaper files are missing.');
  if (
    payload.power.idle_suspend_ac !== 'nothing' ||
    payload.power.idle_suspend_battery !== 'nothing'
  )
    reasons.push(
      'Automatic idle suspend is not disabled on both power sources.'
    );
  if (!payload.power.hibernate_targets_masked)
    reasons.push('Hibernate or hybrid-sleep is no longer masked.');
  if (payload.hygiene.unexpected_dev_listeners > 0)
    reasons.push(
      `${payload.hygiene.unexpected_dev_listeners} unexpected development listener${payload.hygiene.unexpected_dev_listeners === 1 ? '' : 's'} detected.`
    );
  if (payload.route_activity?.source === 'unavailable')
    reasons.push('Agent route status is unavailable.');
  if (
    payload.route_activity?.source === 'codex-route-leases-v2' &&
    (payload.route_activity.residue_jobs ?? 0) > 0
  )
    reasons.push(
      `${payload.route_activity.residue_jobs} agent job${payload.route_activity.residue_jobs === 1 ? '' : 's'} left process residue.`
    );
  if (payload.route_activity?.source === 'codex-route-leases-v2') {
    const unknownRouteItems =
      (payload.route_activity.unknown_routes ?? 0) +
      (payload.route_activity.unknown_jobs ?? 0);
    if (unknownRouteItems > 0)
      reasons.push(
        `${unknownRouteItems} agent route item${unknownRouteItems === 1 ? ' needs' : 's need'} ownership inspection.`
      );
  }
  if (
    payload.process_tags?.source === 'codex-route-hook-v1' &&
    payload.process_tags.unknown_jobs > 0
  )
    reasons.push(
      `${payload.process_tags.unknown_jobs} Codex tag${payload.process_tags.unknown_jobs === 1 ? ' needs' : 's need'} inspection.`
    );
  if (payload.reliability?.source === 'journal-24h') {
    const breakdown = payload.reliability.breakdown;
    if (breakdown) {
      const searchCrashes = breakdown.desktop_search.crash_exits;
      const searchRestarts = breakdown.desktop_search.automatic_restarts;
      if (searchCrashes > 0)
        reasons.push(
          `Desktop search: ${searchCrashes} crash${searchCrashes === 1 ? '' : 'es'}${searchRestarts > 0 ? ` and ${searchRestarts} automatic restart${searchRestarts === 1 ? '' : 's'}` : ''} in the last 24 hours.`
        );
      const otherCrashes = breakdown.other.crash_exits;
      if (otherCrashes > 0)
        reasons.push(
          `${otherCrashes} other service crash${otherCrashes === 1 ? '' : 'es'} recorded in the last 24 hours.`
        );
    } else if (payload.reliability.crash_exits > 0)
      reasons.push(
        `${payload.reliability.crash_exits} service crash${payload.reliability.crash_exits === 1 ? '' : 'es'} recorded in the last 24 hours.`
      );
  }
  if (payload.reliability?.truncated)
    reasons.push('Reliability event count exceeded the collector limit.');

  const critical = payload.disk.root_used_percent >= 90 || failedUnits > 0;
  return {
    state: critical
      ? ('attention' as const)
      : reasons.length > 0
        ? ('watch' as const)
        : ('healthy' as const),
    reasons,
  };
}

export async function saveMachineHealth(payload: MachineHealthPayload) {
  const checkedAt = new Date(payload.checked_at).toISOString();
  const serializedPayload = JSON.stringify({
    ...payload,
    checked_at: checkedAt,
  });
  const failedUnits =
    payload.services.failed_system_units + payload.services.failed_user_units;
  const loadPerCpu = payload.load.one / payload.load.logical_cpus;
  const state = evaluateMachineHealth(payload).state;
  const pressureValues = [
    payload.activity.cpu_pressure_some_percent,
    payload.activity.memory_pressure_full_percent,
    payload.activity.io_pressure_full_percent,
  ].filter((value): value is number => value !== null);
  const pressurePercent =
    pressureValues.length === 0 ? null : Math.max(...pressureValues);

  await client.begin(async sql => {
    await sql`
      INSERT INTO machine_health_status (host, payload, checked_at, updated_at)
      VALUES ('big-red', ${serializedPayload}::text::jsonb, ${checkedAt}, now())
      ON CONFLICT (host)
      DO UPDATE SET
        payload = EXCLUDED.payload,
        checked_at = EXCLUDED.checked_at,
        updated_at = now()
      WHERE machine_health_status.checked_at <= EXCLUDED.checked_at
    `;

    await sql`
      INSERT INTO machine_health_samples (
        host,
        checked_at,
        state,
        root_used_percent,
        memory_used_percent,
        cpu_used_percent,
        load_per_cpu,
        peak_sensor_temperature_c,
        graphics_clock_mhz,
        network_rx_mib_s,
        network_tx_mib_s,
        disk_read_mib_s,
        disk_write_mib_s,
        pressure_percent,
        activity_source,
        activity_sample_count,
        activity_window_minutes,
        uptime_seconds,
        browser_roots,
        browser_rss_bytes,
        codex_workers,
        failed_units,
        unexpected_dev_listeners,
        rdp_connections,
        payload
      )
      VALUES (
        'big-red',
        ${checkedAt},
        ${state},
        ${payload.disk.root_used_percent},
        ${payload.memory.used_percent},
        ${payload.cpu.used_percent},
        ${loadPerCpu},
        ${payload.temperature.peak_sensor_c},
        ${payload.graphics.clock_mhz},
        ${payload.network.rx_mib_s},
        ${payload.network.tx_mib_s},
        ${payload.activity.disk_read_mib_s},
        ${payload.activity.disk_write_mib_s},
        ${pressurePercent},
        ${payload.activity.source},
        ${payload.activity.sample_count},
        ${payload.activity.window_minutes},
        ${payload.uptime_seconds},
        ${payload.hygiene.browser_roots},
        ${payload.hygiene.browser_rss_bytes},
        ${payload.hygiene.codex_workers},
        ${failedUnits},
        ${payload.hygiene.unexpected_dev_listeners},
        ${payload.hygiene.rdp_connections},
        ${serializedPayload}::text::jsonb
      )
      ON CONFLICT (host, checked_at)
      DO UPDATE SET
        state = EXCLUDED.state,
        root_used_percent = EXCLUDED.root_used_percent,
        memory_used_percent = EXCLUDED.memory_used_percent,
        cpu_used_percent = EXCLUDED.cpu_used_percent,
        load_per_cpu = EXCLUDED.load_per_cpu,
        peak_sensor_temperature_c = EXCLUDED.peak_sensor_temperature_c,
        graphics_clock_mhz = EXCLUDED.graphics_clock_mhz,
        network_rx_mib_s = EXCLUDED.network_rx_mib_s,
        network_tx_mib_s = EXCLUDED.network_tx_mib_s,
        disk_read_mib_s = EXCLUDED.disk_read_mib_s,
        disk_write_mib_s = EXCLUDED.disk_write_mib_s,
        pressure_percent = EXCLUDED.pressure_percent,
        activity_source = EXCLUDED.activity_source,
        activity_sample_count = EXCLUDED.activity_sample_count,
        activity_window_minutes = EXCLUDED.activity_window_minutes,
        uptime_seconds = EXCLUDED.uptime_seconds,
        browser_roots = EXCLUDED.browser_roots,
        browser_rss_bytes = EXCLUDED.browser_rss_bytes,
        codex_workers = EXCLUDED.codex_workers,
        failed_units = EXCLUDED.failed_units,
        unexpected_dev_listeners = EXCLUDED.unexpected_dev_listeners,
        rdp_connections = EXCLUDED.rdp_connections,
        payload = EXCLUDED.payload,
        created_at = now()
    `;

    if (payload.codex_usage?.source === 'session-jsonl') {
      const usage = payload.codex_usage;
      await sql`
        SELECT pg_advisory_xact_lock(1129270341)
      `;
      const otherSources = await sql<
        {
          session_fingerprints: string[];
          fingerprints_complete: boolean;
        }[]
      >`
        SELECT session_fingerprints, fingerprints_complete
        FROM codex_token_samples
        WHERE source <> 'big-red'
          AND window_started_at = ${usage.window_started_at}
          AND accounting_state = 'counted'
        FOR UPDATE
      `;
      const usageFingerprints = new Set(usage.session_fingerprints ?? []);
      const overlapsOtherSource = otherSources.some(
        row =>
          !row.fingerprints_complete ||
          row.session_fingerprints.some(fingerprint =>
            usageFingerprints.has(fingerprint)
          )
      );
      const accountingState =
        usage.fingerprints_complete !== true
          ? 'unverified-skipped'
          : overlapsOtherSource
            ? 'overlap-skipped'
            : 'counted';
      await sql`
          INSERT INTO codex_token_samples (
            source,
            window_started_at,
            window_ended_at,
            input_tokens,
            cached_input_tokens,
            cache_write_input_tokens,
            output_tokens,
            reasoning_output_tokens,
            total_tokens,
            model_calls,
            active_routes,
            accounting_state,
            session_fingerprints,
            fingerprints_complete,
            collected_at
          )
          VALUES (
            'big-red',
            ${usage.window_started_at},
            ${usage.window_ended_at},
            ${usage.input_tokens},
            ${usage.cached_input_tokens},
            ${usage.cache_write_input_tokens},
            ${usage.output_tokens},
            ${usage.reasoning_output_tokens},
            ${usage.total_tokens},
            ${usage.model_calls},
            ${usage.active_routes},
            ${accountingState},
            ${sql.array(usage.session_fingerprints ?? [], 25)}::text[],
            ${usage.fingerprints_complete === true},
            ${checkedAt}
          )
          ON CONFLICT (source, window_started_at)
          DO UPDATE SET
            window_ended_at = EXCLUDED.window_ended_at,
            input_tokens = EXCLUDED.input_tokens,
            cached_input_tokens = EXCLUDED.cached_input_tokens,
            cache_write_input_tokens = EXCLUDED.cache_write_input_tokens,
            output_tokens = EXCLUDED.output_tokens,
            reasoning_output_tokens = EXCLUDED.reasoning_output_tokens,
            total_tokens = EXCLUDED.total_tokens,
            model_calls = EXCLUDED.model_calls,
            active_routes = EXCLUDED.active_routes,
            accounting_state = EXCLUDED.accounting_state,
            session_fingerprints = EXCLUDED.session_fingerprints,
            fingerprints_complete = EXCLUDED.fingerprints_complete,
            collected_at = GREATEST(
              codex_token_samples.collected_at,
              EXCLUDED.collected_at
            )
          WHERE codex_token_samples.collected_at <= EXCLUDED.collected_at
      `;
    }

    await sql`
      DELETE FROM machine_health_samples
      WHERE host = 'big-red'
        AND checked_at < now() - interval '365 days'
    `;
    await sql`
      DELETE FROM codex_token_samples
      WHERE window_started_at < now() - interval '365 days'
    `;
  });

  return { host: 'big-red' as const, checkedAt };
}

export async function saveCodexTokenReport(report: CodexTokenReport) {
  const collectedAt = new Date(report.collected_at).toISOString();
  const rows = report.windows.map(window => ({
    source: report.source,
    window_started_at: new Date(window.window_started_at).toISOString(),
    window_ended_at: new Date(window.window_ended_at).toISOString(),
    input_tokens: window.input_tokens,
    cached_input_tokens: window.cached_input_tokens,
    cache_write_input_tokens: window.cache_write_input_tokens,
    output_tokens: window.output_tokens,
    reasoning_output_tokens: window.reasoning_output_tokens,
    total_tokens: window.total_tokens,
    model_calls: window.model_calls,
    active_routes: window.active_routes,
    accounting_state: 'counted' as const,
    session_fingerprints: window.session_fingerprints ?? [],
    fingerprints_complete: window.fingerprints_complete === true,
    collected_at: collectedAt,
  }));

  const persistedRows = await client.begin(async sql => {
    const starts = rows.map(row => row.window_started_at);
    await sql`
      SELECT pg_advisory_xact_lock(1129270341)
    `;
    const existing = await sql<
      {
        window_started_at: Date | string;
        session_fingerprints: string[];
        fingerprints_complete: boolean;
      }[]
    >`
      SELECT
        window_started_at,
        session_fingerprints,
        fingerprints_complete
      FROM codex_token_samples
      WHERE source <> ${report.source}
        AND window_started_at = ANY(${sql.array(starts, 25)}::timestamptz[])
        AND accounting_state = 'counted'
      FOR UPDATE
    `;
    const skippedStarts = new Set<string>();
    for (const row of existing) {
      const startedAt = new Date(row.window_started_at).toISOString();
      const incoming = rows.find(item => item.window_started_at === startedAt);
      if (!incoming) continue;
      if (!row.fingerprints_complete || !incoming.fingerprints_complete) {
        skippedStarts.add(startedAt);
        continue;
      }
      const incomingFingerprints = new Set(incoming.session_fingerprints);
      if (
        row.session_fingerprints.some(fingerprint =>
          incomingFingerprints.has(fingerprint)
        )
      )
        skippedStarts.add(startedAt);
    }

    const databaseRows = rows.map(row => ({
      ...row,
      accounting_state: skippedStarts.has(row.window_started_at)
        ? ('overlap-skipped' as const)
        : ('counted' as const),
      session_fingerprints: sql.array(row.session_fingerprints, 25),
    }));
    const returnedRows = await sql`
      INSERT INTO codex_token_samples ${sql(
        databaseRows,
        'source',
        'window_started_at',
        'window_ended_at',
        'input_tokens',
        'cached_input_tokens',
        'cache_write_input_tokens',
        'output_tokens',
        'reasoning_output_tokens',
        'total_tokens',
        'model_calls',
        'active_routes',
        'accounting_state',
        'session_fingerprints',
        'fingerprints_complete',
        'collected_at'
      )}
      ON CONFLICT (source, window_started_at)
      DO UPDATE SET
        window_ended_at = EXCLUDED.window_ended_at,
        input_tokens = EXCLUDED.input_tokens,
        cached_input_tokens = EXCLUDED.cached_input_tokens,
        cache_write_input_tokens = EXCLUDED.cache_write_input_tokens,
        output_tokens = EXCLUDED.output_tokens,
        reasoning_output_tokens = EXCLUDED.reasoning_output_tokens,
        total_tokens = EXCLUDED.total_tokens,
        model_calls = EXCLUDED.model_calls,
        active_routes = EXCLUDED.active_routes,
        accounting_state = EXCLUDED.accounting_state,
        session_fingerprints = EXCLUDED.session_fingerprints,
        fingerprints_complete = EXCLUDED.fingerprints_complete,
        collected_at = GREATEST(
          codex_token_samples.collected_at,
          EXCLUDED.collected_at
        )
      WHERE codex_token_samples.collected_at <= EXCLUDED.collected_at
      RETURNING accounting_state
    `;
    const writtenRows = returnedRows.map(row => {
      const accountingState = row.accounting_state;
      if (
        accountingState !== 'counted' &&
        accountingState !== 'overlap-skipped' &&
        accountingState !== 'unverified-skipped'
      )
        throw new Error('Stored Codex accounting state is invalid');
      return { accounting_state: accountingState };
    });
    await sql`
      DELETE FROM codex_token_samples
      WHERE window_started_at < now() - interval '365 days'
    `;
    return writtenRows;
  });

  const counted = persistedRows.filter(
    row => row.accounting_state === 'counted'
  ).length;
  const skipped = persistedRows.length - counted;

  return {
    source: report.source,
    windows: rows.length,
    counted,
    skipped,
    ignored: rows.length - persistedRows.length,
    collectedAt,
  };
}

export async function readMachineHealth(
  days = 30
): Promise<MachineHealthReadResult> {
  const requestId = randomUUID();
  if (!process.env.DATABASE_URL) {
    return {
      status: 'configuration-error',
      message: 'Machine health database configuration is missing.',
      requestId,
    };
  }

  try {
    const [latestRows, sampleRows, codexRows] = await Promise.all([
      client<
        {
          host: 'big-red';
          payload: unknown;
          checked_at: Date | string;
          updated_at: Date | string;
        }[]
      >`
        SELECT host, payload, checked_at, updated_at
        FROM machine_health_status
        WHERE host = 'big-red'
        LIMIT 1
      `,
      client<
        {
          checked_at: Date | string;
          cpu_used_percent: number | string;
          root_used_percent: number | string;
          memory_used_percent: number | string;
          load_per_cpu: number | string;
          peak_sensor_temperature_c: number | string | null;
          graphics_clock_mhz: number | string | null;
          network_rx_mib_s: number | string;
          network_tx_mib_s: number | string;
          disk_read_mib_s: number | string | null;
          disk_write_mib_s: number | string | null;
          pressure_percent: number | string | null;
          activity_source: MachineHealthPayload['activity']['source'];
          activity_sample_count: number | string;
          activity_window_minutes: number | string;
          uptime_seconds: number | string | bigint;
          browser_roots: number | string;
          browser_rss_bytes: number | string | bigint;
          codex_workers: number | string;
          failed_units: number | string;
          unexpected_dev_listeners: number | string;
          rdp_connections: number | string;
          payload: unknown;
        }[]
      >`
        SELECT
          checked_at,
          cpu_used_percent,
          root_used_percent,
          memory_used_percent,
          load_per_cpu,
          peak_sensor_temperature_c,
          graphics_clock_mhz,
          network_rx_mib_s,
          network_tx_mib_s,
          disk_read_mib_s,
          disk_write_mib_s,
          pressure_percent,
          activity_source,
          activity_sample_count,
          activity_window_minutes,
          uptime_seconds,
          browser_roots,
          browser_rss_bytes,
          codex_workers,
          failed_units,
          unexpected_dev_listeners,
          rdp_connections,
          payload
        FROM machine_health_samples
        WHERE host = 'big-red'
          AND checked_at >= now() - (${Math.max(1, Math.min(365, Math.floor(days)))}::int * interval '1 day')
        ORDER BY checked_at ASC
      `,
      client<
        {
          source: CodexTokenSource;
          accounting_state:
            | 'counted'
            | 'overlap-skipped'
            | 'unverified-skipped';
          window_started_at: Date | string;
          window_ended_at: Date | string;
          input_tokens: number | string | bigint;
          cached_input_tokens: number | string | bigint;
          cache_write_input_tokens: number | string | bigint;
          output_tokens: number | string | bigint;
          reasoning_output_tokens: number | string | bigint;
          total_tokens: number | string | bigint;
          model_calls: number | string;
          active_routes: number | string;
        }[]
      >`
        SELECT
          source,
          accounting_state,
          window_started_at,
          window_ended_at,
          input_tokens,
          cached_input_tokens,
          cache_write_input_tokens,
          output_tokens,
          reasoning_output_tokens,
          total_tokens,
          model_calls,
          active_routes
        FROM codex_token_samples
        WHERE window_started_at >= now() - (${Math.max(1, Math.min(365, Math.floor(days)))}::int * interval '1 day')
        ORDER BY window_started_at ASC, source ASC
      `,
    ]);

    const latest = latestRows[0];
    if (!latest) return { status: 'empty' };
    const parsed = machineHealthPayloadSchema.safeParse(latest.payload);
    if (!parsed.success)
      throw new Error('Stored machine health payload is invalid');

    return {
      status: 'ok',
      report: {
        host: latest.host,
        payload: parsed.data,
        checkedAt: new Date(latest.checked_at).toISOString(),
        updatedAt: new Date(latest.updated_at).toISOString(),
      },
      observedAt: new Date().toISOString(),
      codexSamples: codexRows.map(row => ({
        source: row.source,
        accountingState: row.accounting_state,
        windowStartedAt: new Date(row.window_started_at).toISOString(),
        windowEndedAt: new Date(row.window_ended_at).toISOString(),
        inputTokens: toNumber(row.input_tokens),
        cachedInputTokens: toNumber(row.cached_input_tokens),
        cacheWriteInputTokens: toNumber(row.cache_write_input_tokens),
        outputTokens: toNumber(row.output_tokens),
        reasoningOutputTokens: toNumber(row.reasoning_output_tokens),
        totalTokens: toNumber(row.total_tokens),
        modelCalls: toNumber(row.model_calls),
        activeRoutes: toNumber(row.active_routes),
      })),
      samples: sampleRows.map(row => {
        const parsedSample = machineHealthPayloadSchema.safeParse(row.payload);
        const codexUsage =
          parsedSample.success &&
          parsedSample.data.codex_usage?.source === 'session-jsonl'
            ? parsedSample.data.codex_usage
            : null;
        const activity = parsedSample.success
          ? parsedSample.data.activity
          : null;
        const buildState =
          parsedSample.success &&
          parsedSample.data.build_state?.source === 'filesystem'
            ? parsedSample.data.build_state
            : null;
        const routeActivity =
          parsedSample.success &&
          parsedSample.data.route_activity?.source === 'codex-route-leases-v2'
            ? parsedSample.data.route_activity
            : null;
        const codexState =
          parsedSample.success &&
          parsedSample.data.codex_state?.source === 'codex-state-inventory-v1'
            ? parsedSample.data.codex_state
            : null;
        const codexRuntime =
          parsedSample.success &&
          parsedSample.data.hygiene.codex_runtime?.source ===
            'codex-runtime-tree-v1'
            ? parsedSample.data.hygiene.codex_runtime
            : null;
        const remoteTransport =
          parsedSample.success &&
          parsedSample.data.network.remote_client?.source === 'tailscale-status'
            ? (parsedSample.data.network.remote_client.transport_probe ?? null)
            : null;
        return {
          checkedAt: new Date(row.checked_at).toISOString(),
          panelOn: parsedSample.success
            ? panelOnSample(parsedSample.data)
            : null,
          cpuUsedPercent: toNumber(row.cpu_used_percent),
          rootUsedPercent: toNumber(row.root_used_percent),
          memoryUsedPercent: toNumber(row.memory_used_percent),
          loadPerCpu: toNumber(row.load_per_cpu),
          peakSensorTemperatureC:
            row.peak_sensor_temperature_c === null
              ? null
              : toNumber(row.peak_sensor_temperature_c),
          graphicsClockMhz:
            row.graphics_clock_mhz === null
              ? null
              : toNumber(row.graphics_clock_mhz),
          networkRxMibS: toNumber(row.network_rx_mib_s),
          networkTxMibS: toNumber(row.network_tx_mib_s),
          diskReadMibS:
            row.disk_read_mib_s === null ? null : toNumber(row.disk_read_mib_s),
          diskWriteMibS:
            row.disk_write_mib_s === null
              ? null
              : toNumber(row.disk_write_mib_s),
          pressurePercent:
            row.pressure_percent === null
              ? null
              : toNumber(row.pressure_percent),
          coreAveragePercent: activity?.core_average_percent ?? null,
          corePeakPercent: activity?.core_peak_percent ?? null,
          networkPeakMibS: activity?.network_peak_mib_s ?? null,
          diskPeakMibS: activity?.disk_peak_mib_s ?? null,
          activitySource: row.activity_source,
          activitySampleCount: toNumber(row.activity_sample_count),
          activityWindowMinutes: toNumber(row.activity_window_minutes),
          uptimeSeconds: toNumber(row.uptime_seconds),
          browserRoots: toNumber(row.browser_roots),
          browserRssBytes: toNumber(row.browser_rss_bytes),
          codexWorkers: toNumber(row.codex_workers),
          codexRuntimeProcesses: codexRuntime?.processes ?? null,
          codexRuntimePssBytes: codexRuntime?.pss_bytes ?? null,
          failedUnits: toNumber(row.failed_units),
          unexpectedDevListeners: toNumber(row.unexpected_dev_listeners),
          rdpConnections: toNumber(row.rdp_connections),
          remoteTransportPath: remoteTransport?.path ?? null,
          remoteRttMs: remoteTransport?.rtt_ms ?? null,
          codexUsageWindowStartedAt: codexUsage?.window_started_at ?? null,
          codexInputTokens: codexUsage?.input_tokens ?? null,
          codexCachedInputTokens: codexUsage?.cached_input_tokens ?? null,
          codexCacheWriteInputTokens:
            codexUsage?.cache_write_input_tokens ?? null,
          codexOutputTokens: codexUsage?.output_tokens ?? null,
          codexReasoningOutputTokens:
            codexUsage?.reasoning_output_tokens ?? null,
          codexTotalTokens: codexUsage?.total_tokens ?? null,
          codexModelCalls: codexUsage?.model_calls ?? null,
          codexActiveRoutes: codexUsage?.active_routes ?? null,
          routeActiveRoutes: routeActivity?.active_routes ?? null,
          routeActiveJobs: routeActivity?.active_jobs ?? null,
          routeTaggedProcesses: routeActivity?.tagged_processes ?? null,
          routeTaggedRssBytes: routeActivity?.tagged_rss_bytes ?? null,
          routeTaggedMemoryBytes:
            routeActivity?.tagged_memory_current_bytes ?? null,
          routeResidueJobs: routeActivity?.residue_jobs ?? null,
          routeUnknownCount: routeActivity
            ? (routeActivity.unknown_routes ?? 0) +
              (routeActivity.unknown_jobs ?? 0)
            : null,
          codexStateAllocatedBytes: codexState?.allocated_bytes ?? null,
          buildStateGib: buildState?.total_gib ?? null,
          buildTargetCount: buildState?.target_count ?? null,
          activeBuildProcesses: buildState?.active_build_processes ?? null,
        };
      }),
    };
  } catch (error) {
    console.error('Unable to read machine health data', { requestId, error });
    return {
      status: 'error',
      message: 'The machine health report could not be read.',
      requestId,
    };
  }
}
