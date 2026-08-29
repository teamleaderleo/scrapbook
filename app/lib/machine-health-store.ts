import { randomUUID } from 'node:crypto';

import { client } from '@/app/lib/db/db';
import { z } from 'zod';

const percent = z.number().finite().min(0).max(100);
const nonnegative = z.number().finite().min(0);
const nullableNonnegative = nonnegative.nullable();
const nonnegativeInteger = z.number().int().min(0);
const serviceState = z.enum(['active', 'inactive', 'missing', 'unknown']);
const idleSleepAction = z.enum([
  'nothing',
  'suspend',
  'hibernate',
  'shutdown',
  'unknown',
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
  memory: z.object({
    used_percent: percent,
    total_gib: nonnegative,
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
  activity: z.object({
    source: z.enum(['sysstat-10m', 'point']),
    window_minutes: z.number().int().min(0).max(180),
    sample_count: z.number().int().min(1).max(18),
    cpu_peak_percent: percent,
    memory_peak_percent: percent,
    cpu_pressure_some_percent: percent.nullable(),
    memory_pressure_full_percent: percent.nullable(),
    io_pressure_full_percent: percent.nullable(),
    disk_read_mib_s: nullableNonnegative,
    disk_write_mib_s: nullableNonnegative,
  }),
  codex_usage: z
    .object({
      source: z.enum(['session-jsonl', 'unavailable']),
      window_started_at: z.string().datetime({ offset: true }),
      window_ended_at: z.string().datetime({ offset: true }),
      input_tokens: nonnegativeInteger,
      cached_input_tokens: nonnegativeInteger,
      cache_write_input_tokens: nonnegativeInteger,
      output_tokens: nonnegativeInteger,
      reasoning_output_tokens: nonnegativeInteger,
      total_tokens: nonnegativeInteger,
      model_calls: nonnegativeInteger,
      active_routes: nonnegativeInteger,
    })
    .optional(),
  services: z.object({
    failed_system_units: nonnegativeInteger,
    failed_user_units: nonnegativeInteger,
    ssh: serviceState,
    tailscale: serviceState,
    network_manager: serviceState,
    time_sync: serviceState,
  }),
  network: z.object({
    connectivity: z.enum(['full', 'limited', 'portal', 'none', 'unknown']),
    tailscale_backend: z.enum(['running', 'needs-login', 'stopped', 'unknown']),
    tailscale_self_online: z.boolean().nullable(),
    rx_mib_s: nonnegative,
    tx_mib_s: nonnegative,
  }),
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
    unexpected_dev_listeners: nonnegativeInteger,
    rdp_connections: nonnegativeInteger.default(0),
  }),
  build_state: z
    .object({
      source: z.enum(['filesystem', 'unavailable']),
      total_gib: nullableNonnegative,
      target_gib: nullableNonnegative,
      glaeda_cache_gib: nullableNonnegative,
      target_count: nonnegativeInteger.nullable(),
      active_build_processes: nonnegativeInteger.nullable(),
    })
    .optional(),
});

export type MachineHealthPayload = z.infer<typeof machineHealthPayloadSchema>;

export type MachineHealthSample = {
  checkedAt: string;
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
  activitySource: MachineHealthPayload['activity']['source'];
  activitySampleCount: number;
  activityWindowMinutes: number;
  uptimeSeconds: number;
  browserRoots: number;
  browserRssBytes: number;
  codexWorkers: number;
  failedUnits: number;
  unexpectedDevListeners: number;
  rdpConnections: number;
  codexUsageWindowStartedAt: string | null;
  codexInputTokens: number | null;
  codexCachedInputTokens: number | null;
  codexOutputTokens: number | null;
  codexReasoningOutputTokens: number | null;
  codexModelCalls: number | null;
  codexActiveRoutes: number | null;
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

export type MachineHealthReadResult =
  | {
      status: 'ok';
      report: StoredMachineHealth;
      samples: MachineHealthSample[];
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

    await sql`
      DELETE FROM machine_health_samples
      WHERE host = 'big-red'
        AND checked_at < now() - interval '90 days'
    `;
  });

  return { host: 'big-red' as const, checkedAt };
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
    const [latestRows, sampleRows] = await Promise.all([
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
          AND checked_at >= now() - (${Math.max(1, Math.min(90, Math.floor(days)))}::int * interval '1 day')
        ORDER BY checked_at ASC
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
      samples: sampleRows.map(row => {
        const parsedSample = machineHealthPayloadSchema.safeParse(row.payload);
        const codexUsage =
          parsedSample.success &&
          parsedSample.data.codex_usage?.source === 'session-jsonl'
            ? parsedSample.data.codex_usage
            : null;
        const buildState =
          parsedSample.success &&
          parsedSample.data.build_state?.source === 'filesystem'
            ? parsedSample.data.build_state
            : null;
        return {
          checkedAt: new Date(row.checked_at).toISOString(),
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
          activitySource: row.activity_source,
          activitySampleCount: toNumber(row.activity_sample_count),
          activityWindowMinutes: toNumber(row.activity_window_minutes),
          uptimeSeconds: toNumber(row.uptime_seconds),
          browserRoots: toNumber(row.browser_roots),
          browserRssBytes: toNumber(row.browser_rss_bytes),
          codexWorkers: toNumber(row.codex_workers),
          failedUnits: toNumber(row.failed_units),
          unexpectedDevListeners: toNumber(row.unexpected_dev_listeners),
          rdpConnections: toNumber(row.rdp_connections),
          codexUsageWindowStartedAt: codexUsage?.window_started_at ?? null,
          codexInputTokens: codexUsage?.input_tokens ?? null,
          codexCachedInputTokens: codexUsage?.cached_input_tokens ?? null,
          codexOutputTokens: codexUsage?.output_tokens ?? null,
          codexReasoningOutputTokens:
            codexUsage?.reasoning_output_tokens ?? null,
          codexModelCalls: codexUsage?.model_calls ?? null,
          codexActiveRoutes: codexUsage?.active_routes ?? null,
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
