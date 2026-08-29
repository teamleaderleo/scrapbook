import { randomUUID } from 'node:crypto';

import { client } from '@/app/lib/db/db';
import { z } from 'zod';

const percent = z.number().finite().min(0).max(100);
const nonnegative = z.number().finite().min(0);
const nonnegativeInteger = z.number().int().min(0);
const serviceState = z.enum(['active', 'inactive', 'missing', 'unknown']);

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
  }),
  power: z.object({
    profile: z.enum(['performance', 'balanced', 'power-saver', 'unknown']),
    sleep_targets_masked: z.boolean(),
  }),
  hygiene: z.object({
    browser_roots: nonnegativeInteger,
    codex_workers: nonnegativeInteger,
    unexpected_dev_listeners: nonnegativeInteger,
  }),
});

export type MachineHealthPayload = z.infer<typeof machineHealthPayloadSchema>;

export type MachineHealthSample = {
  checkedAt: string;
  rootUsedPercent: number;
  memoryUsedPercent: number;
  loadPerCpu: number;
  peakSensorTemperatureC: number | null;
  failedUnits: number;
  unexpectedDevListeners: number;
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
  if (!payload.power.sleep_targets_masked)
    reasons.push('One or more protected sleep targets are not masked.');
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
        load_per_cpu,
        peak_sensor_temperature_c,
        failed_units,
        unexpected_dev_listeners,
        payload
      )
      VALUES (
        'big-red',
        ${checkedAt},
        ${state},
        ${payload.disk.root_used_percent},
        ${payload.memory.used_percent},
        ${loadPerCpu},
        ${payload.temperature.peak_sensor_c},
        ${failedUnits},
        ${payload.hygiene.unexpected_dev_listeners},
        ${serializedPayload}::text::jsonb
      )
      ON CONFLICT (host, checked_at)
      DO UPDATE SET
        state = EXCLUDED.state,
        root_used_percent = EXCLUDED.root_used_percent,
        memory_used_percent = EXCLUDED.memory_used_percent,
        load_per_cpu = EXCLUDED.load_per_cpu,
        peak_sensor_temperature_c = EXCLUDED.peak_sensor_temperature_c,
        failed_units = EXCLUDED.failed_units,
        unexpected_dev_listeners = EXCLUDED.unexpected_dev_listeners,
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
          root_used_percent: number | string;
          memory_used_percent: number | string;
          load_per_cpu: number | string;
          peak_sensor_temperature_c: number | string | null;
          failed_units: number | string;
          unexpected_dev_listeners: number | string;
        }[]
      >`
        SELECT
          checked_at,
          root_used_percent,
          memory_used_percent,
          load_per_cpu,
          peak_sensor_temperature_c,
          failed_units,
          unexpected_dev_listeners
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
      samples: sampleRows.map(row => ({
        checkedAt: new Date(row.checked_at).toISOString(),
        rootUsedPercent: toNumber(row.root_used_percent),
        memoryUsedPercent: toNumber(row.memory_used_percent),
        loadPerCpu: toNumber(row.load_per_cpu),
        peakSensorTemperatureC:
          row.peak_sensor_temperature_c === null
            ? null
            : toNumber(row.peak_sensor_temperature_c),
        failedUnits: toNumber(row.failed_units),
        unexpectedDevListeners: toNumber(row.unexpected_dev_listeners),
      })),
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
