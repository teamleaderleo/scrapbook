import { client } from '@/app/lib/db/db';

export type ProxyHealthPayload = {
  host?: string;
  checked_at?: string;
  mode?: string;
  services?: Record<string, string>;
  egress?: {
    ipv4?: string | null;
    ipv6?: string | null;
    sidecar_ok?: boolean;
    fallback_ok?: boolean;
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

  tableReady = true;
}

export async function saveProxyHealth(payload: ProxyHealthPayload) {
  await ensureProxyHealthTable();

  const host = normalizeHost(payload.host);
  const checkedAt = normalizeCheckedAt(payload.checked_at);
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
