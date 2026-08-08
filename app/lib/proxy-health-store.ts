import { randomUUID } from 'node:crypto';

import { client } from '@/app/lib/db/db';
import { z } from 'zod';

const shortText = z.string().max(256);
const longText = z.string().max(2_048);
const finiteNumber = z.number().finite();
const nullableNumber = finiteNumber.nullable();
const trafficSampleSchema = z.object({
  checked_at: shortText.optional(),
  bytes: nullableNumber.optional(),
  in_bytes: nullableNumber.optional(),
  out_bytes: nullableNumber.optional(),
});

/**
 * The reporter is an external client, so ingestion uses an allowlist instead
 * of persisting arbitrary JSON. Zod strips unknown keys at every object level.
 */
export const proxyHealthPayloadSchema = z.object({
  host: z.string().trim().min(1).max(128).optional(),
  checked_at: shortText.datetime({ offset: true }).optional(),
  mode: z.string().max(64).optional(),
  services: z.record(z.string().max(128)).optional(),
  egress: z
    .object({
      ipv4: shortText.nullable().optional(),
      ipv6: shortText.nullable().optional(),
      fallback_ipv4: shortText.nullable().optional(),
      sidecar_ok: z.boolean().optional(),
      fallback_ok: z.boolean().optional(),
    })
    .optional(),
  latency: z
    .object({
      wg_ms: nullableNumber.optional(),
      public_ms: nullableNumber.optional(),
      target: shortText.optional(),
    })
    .optional(),
  globalping: z
    .object({
      location: shortText.optional(),
      bandwagon_ms: nullableNumber.optional(),
      linode_ms: nullableNumber.optional(),
      bandwagon_target: shortText.optional(),
      linode_target: shortText.optional(),
      source: shortText.optional(),
      checked_at: shortText.optional(),
      error: longText.optional(),
    })
    .optional(),
  provider: z
    .object({
      usage: z
        .object({
          source: shortText.optional(),
          used_bytes: nullableNumber.optional(),
          limit_bytes: nullableNumber.optional(),
          reset_at: shortText.nullable().optional(),
          suspended: z.boolean().nullable().optional(),
          policy_violation: z.boolean().nullable().optional(),
          error: z.union([longText, finiteNumber]).nullable().optional(),
          message: longText.nullable().optional(),
          raw_error: longText.nullable().optional(),
          raw_sample_count: nullableNumber.optional(),
          last_raw_at: shortText.nullable().optional(),
          daily: z.array(trafficSampleSchema).max(400).optional(),
          hourly: z.array(trafficSampleSchema).max(1_000).optional(),
        })
        .optional(),
    })
    .optional(),
  wireguard: z
    .object({
      latest_handshake_seconds_ago: nullableNumber.optional(),
      rx_bytes: nullableNumber.optional(),
      tx_bytes: nullableNumber.optional(),
    })
    .optional(),
  expected: z
    .object({
      ipv4: shortText.optional(),
      ipv6: shortText.optional(),
    })
    .optional(),
  xray: z
    .object({
      outbound_tag: shortText.nullable().optional(),
      outbound_address: shortText.nullable().optional(),
      outbound_port: nullableNumber.optional(),
      error: longText.optional(),
    })
    .optional(),
  errors: z.array(longText).max(50).optional(),
});

export type ProxyHealthPayload = z.infer<typeof proxyHealthPayloadSchema>;

export type StoredProxyHealth = {
  host: string;
  payload: ProxyHealthPayload;
  checkedAt: string | null;
  updatedAt: string;
};

export type ProxyHealthSample = {
  checkedAt: string;
  rxBytes: number | null;
  txBytes: number | null;
  publicLatencyMs: number | null;
  wgLatencyMs: number | null;
  shanghaiBandwagonMs: number | null;
  shanghaiLinodeMs: number | null;
  mode: string | null;
};

export type ProxyHealthReadResult =
  | { status: 'ok'; report: StoredProxyHealth; samples: ProxyHealthSample[] }
  | { status: 'empty' }
  | { status: 'configuration-error'; message: string; requestId: string }
  | { status: 'error'; message: string; requestId: string };

function normalizeHost(host: unknown) {
  if (typeof host !== 'string') return 'bandwagon-la';
  const trimmed = host.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 128) : 'bandwagon-la';
}

function normalizeCheckedAt(value: unknown) {
  if (typeof value !== 'string') return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function toInteger(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value))
    return Math.max(0, Math.floor(value));
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Number(value))
  )
    return Number(value);
  return null;
}

export function normalizeStoredProxyPayload(
  value: unknown
): ProxyHealthPayload {
  let current = value;

  for (let depth = 0; depth < 3 && typeof current === 'string'; depth += 1) {
    try {
      current = JSON.parse(current);
    } catch {
      return {};
    }
  }

  if (!current || typeof current !== 'object' || Array.isArray(current))
    return {};
  return current as ProxyHealthPayload;
}

export async function saveProxyHealth(payload: ProxyHealthPayload) {
  const host = normalizeHost(payload.host);
  const checkedAt = normalizeCheckedAt(payload.checked_at);
  const rxBytes = toInteger(payload.wireguard?.rx_bytes);
  const txBytes = toInteger(payload.wireguard?.tx_bytes);
  const publicLatencyMs = toNumber(payload.latency?.public_ms);
  const wgLatencyMs = toNumber(payload.latency?.wg_ms);
  const shanghaiBandwagonMs = toNumber(payload.globalping?.bandwagon_ms);
  const shanghaiLinodeMs = toNumber(payload.globalping?.linode_ms);
  const mode =
    typeof payload.mode === 'string' ? payload.mode.slice(0, 64) : null;
  const normalizedPayload: ProxyHealthPayload = {
    ...payload,
    host,
    checked_at: checkedAt,
  };
  const serializedPayload = JSON.stringify(normalizedPayload);

  await client`
    INSERT INTO proxy_health_status (host, payload, checked_at, updated_at)
    VALUES (${host}, ${serializedPayload}::text::jsonb, ${checkedAt}, now())
    ON CONFLICT (host)
    DO UPDATE SET
      payload = EXCLUDED.payload,
      checked_at = EXCLUDED.checked_at,
      updated_at = now()
  `;

  await client`
    INSERT INTO proxy_health_samples (
      host,
      checked_at,
      mode,
      rx_bytes,
      tx_bytes,
      public_latency_ms,
      wg_latency_ms,
      shanghai_bandwagon_ms,
      shanghai_linode_ms,
      payload
    )
    VALUES (
      ${host},
      ${checkedAt},
      ${mode},
      ${rxBytes},
      ${txBytes},
      ${publicLatencyMs},
      ${wgLatencyMs},
      ${shanghaiBandwagonMs},
      ${shanghaiLinodeMs},
      ${serializedPayload}::text::jsonb
    )
  `;

  return { host, checkedAt };
}

export async function getLatestProxyHealth(
  host = 'bandwagon-la'
): Promise<StoredProxyHealth | null> {
  const rows = await client<
    {
      host: string;
      payload: unknown;
      checked_at: Date | string | null;
      updated_at: Date | string;
    }[]
  >`
    SELECT host, payload, checked_at, updated_at
    FROM proxy_health_status
    WHERE host = ${normalizeHost(host)}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    host: row.host,
    payload: normalizeStoredProxyPayload(row.payload),
    checkedAt: row.checked_at ? new Date(row.checked_at).toISOString() : null,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getProxyHealthSamples(
  host = 'bandwagon-la',
  days = 8
): Promise<ProxyHealthSample[]> {
  const rows = await client<
    {
      checked_at: Date | string;
      rx_bytes: number | string | bigint | null;
      tx_bytes: number | string | bigint | null;
      public_latency_ms: number | string | bigint | null;
      wg_latency_ms: number | string | bigint | null;
      shanghai_bandwagon_ms: number | string | bigint | null;
      shanghai_linode_ms: number | string | bigint | null;
      mode: string | null;
    }[]
  >`
    SELECT
      checked_at,
      rx_bytes,
      tx_bytes,
      public_latency_ms,
      wg_latency_ms,
      shanghai_bandwagon_ms,
      shanghai_linode_ms,
      mode
    FROM proxy_health_samples
    WHERE host = ${normalizeHost(host)}
      AND checked_at >= now() - (${days}::int * interval '1 day')
    ORDER BY checked_at ASC
  `;

  return rows.map(row => ({
    checkedAt: new Date(row.checked_at).toISOString(),
    rxBytes: toInteger(row.rx_bytes),
    txBytes: toInteger(row.tx_bytes),
    publicLatencyMs: toNumber(row.public_latency_ms),
    wgLatencyMs: toNumber(row.wg_latency_ms),
    shanghaiBandwagonMs: toNumber(row.shanghai_bandwagon_ms),
    shanghaiLinodeMs: toNumber(row.shanghai_linode_ms),
    mode: row.mode,
  }));
}

export async function readProxyHealth(
  host = 'bandwagon-la',
  days = 8
): Promise<ProxyHealthReadResult> {
  const requestId = randomUUID();

  if (!process.env.DATABASE_URL) {
    return {
      status: 'configuration-error',
      message: 'Proxy database configuration is missing.',
      requestId,
    };
  }

  try {
    const [report, samples] = await Promise.all([
      getLatestProxyHealth(host),
      getProxyHealthSamples(host, days),
    ]);

    if (!report) return { status: 'empty' };
    return { status: 'ok', report, samples };
  } catch (error) {
    console.error('Unable to read proxy health data', { requestId, error });
    return {
      status: 'error',
      message: 'The proxy report could not be read.',
      requestId,
    };
  }
}
