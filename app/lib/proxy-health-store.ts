import { client } from '@/app/lib/db/db';

export type ProxyHealthPayload = {
  host?: string;
  checked_at?: string;
  mode?: string;
  services?: Record<string, string>;
  egress?: {
    ipv4?: string | null;
    ipv6?: string | null;
    fallback_ipv4?: string | null;
    sidecar_ok?: boolean;
    fallback_ok?: boolean;
  };
  latency?: {
    wg_ms?: number | null;
    public_ms?: number | null;
    target?: string;
  };
  globalping?: {
    location?: string;
    bandwagon_ms?: number | null;
    linode_ms?: number | null;
    bandwagon_target?: string;
    linode_target?: string;
    source?: string;
    checked_at?: string;
    error?: string;
  };
  provider?: {
    usage?: {
      source?: string;
      used_bytes?: number | null;
      limit_bytes?: number | null;
      reset_at?: string | null;
      suspended?: boolean | null;
      policy_violation?: boolean | null;
      error?: string | number | null;
      message?: string | null;
      raw_error?: string | null;
      raw_sample_count?: number | null;
      last_raw_at?: string | null;
      daily?: Array<{
        checked_at?: string;
        bytes?: number | null;
        in_bytes?: number | null;
        out_bytes?: number | null;
      }>;
      hourly?: Array<{
        checked_at?: string;
        bytes?: number | null;
        in_bytes?: number | null;
        out_bytes?: number | null;
      }>;
    };
  };
  wireguard?: {
    latest_handshake_seconds_ago?: number | null;
    rx_bytes?: number | null;
    tx_bytes?: number | null;
  };
  expected?: {
    ipv4?: string;
    ipv6?: string;
  };
  xray?: {
    outbound_tag?: string | null;
    outbound_address?: string | null;
    outbound_port?: number | null;
  };
  errors?: string[];
  [key: string]: unknown;
};

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

let tableReady = false;

function normalizeHost(host: unknown) {
  if (typeof host !== 'string') return 'bandwagon-la';
  const trimmed = host.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 128) : 'bandwagon-la';
}

function normalizeCheckedAt(value: unknown) {
  if (typeof value !== 'string') return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function toInteger(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

async function ensureProxyHealthTable() {
  if (tableReady) return;

  await client`
    CREATE TABLE IF NOT EXISTS proxy_health_status (
      host text PRIMARY KEY,
      payload jsonb NOT NULL,
      checked_at timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS proxy_health_samples (
      id bigserial PRIMARY KEY,
      host text NOT NULL,
      checked_at timestamptz NOT NULL,
      mode text,
      rx_bytes bigint,
      tx_bytes bigint,
      public_latency_ms double precision,
      wg_latency_ms double precision,
      shanghai_bandwagon_ms double precision,
      shanghai_linode_ms double precision,
      payload jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await client`
    ALTER TABLE proxy_health_samples
    ADD COLUMN IF NOT EXISTS public_latency_ms double precision
  `;

  await client`
    ALTER TABLE proxy_health_samples
    ADD COLUMN IF NOT EXISTS wg_latency_ms double precision
  `;

  await client`
    ALTER TABLE proxy_health_samples
    ADD COLUMN IF NOT EXISTS shanghai_bandwagon_ms double precision
  `;

  await client`
    ALTER TABLE proxy_health_samples
    ADD COLUMN IF NOT EXISTS shanghai_linode_ms double precision
  `;

  await client`
    CREATE INDEX IF NOT EXISTS proxy_health_samples_host_checked_idx
    ON proxy_health_samples (host, checked_at DESC)
  `;

  tableReady = true;
}

export async function saveProxyHealth(payload: ProxyHealthPayload) {
  await ensureProxyHealthTable();

  const host = normalizeHost(payload.host);
  const checkedAt = normalizeCheckedAt(payload.checked_at);
  const rxBytes = toInteger(payload.wireguard?.rx_bytes);
  const txBytes = toInteger(payload.wireguard?.tx_bytes);
  const publicLatencyMs = toNumber(payload.latency?.public_ms);
  const wgLatencyMs = toNumber(payload.latency?.wg_ms);
  const shanghaiBandwagonMs = toNumber(payload.globalping?.bandwagon_ms);
  const shanghaiLinodeMs = toNumber(payload.globalping?.linode_ms);
  const mode = typeof payload.mode === 'string' ? payload.mode.slice(0, 64) : null;
  const normalizedPayload: ProxyHealthPayload = {
    ...payload,
    host,
    checked_at: checkedAt,
  };

  await client`
    INSERT INTO proxy_health_status (host, payload, checked_at, updated_at)
    VALUES (${host}, ${JSON.stringify(normalizedPayload)}::jsonb, ${checkedAt}, now())
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
      ${JSON.stringify(normalizedPayload)}::jsonb
    )
  `;

  return { host, checkedAt };
}

export async function getLatestProxyHealth(host = 'bandwagon-la'): Promise<StoredProxyHealth | null> {
  await ensureProxyHealthTable();

  const rows = await client<{
    host: string;
    payload: ProxyHealthPayload;
    checked_at: Date | string | null;
    updated_at: Date | string;
  }[]>`
    SELECT host, payload, checked_at, updated_at
    FROM proxy_health_status
    WHERE host = ${normalizeHost(host)}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    host: row.host,
    payload: row.payload,
    checkedAt: row.checked_at ? new Date(row.checked_at).toISOString() : null,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getProxyHealthSamples(host = 'bandwagon-la', days = 8): Promise<ProxyHealthSample[]> {
  await ensureProxyHealthTable();

  const rows = await client<{
    checked_at: Date | string;
    rx_bytes: number | string | bigint | null;
    tx_bytes: number | string | bigint | null;
    public_latency_ms: number | string | bigint | null;
    wg_latency_ms: number | string | bigint | null;
    shanghai_bandwagon_ms: number | string | bigint | null;
    shanghai_linode_ms: number | string | bigint | null;
    mode: string | null;
  }[]>`
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

  return rows.map((row) => ({
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
