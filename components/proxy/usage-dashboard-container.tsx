import { connection } from 'next/server';

import type { ProxyHealthPayload, ProxyHealthSample } from '@/app/lib/proxy-health-store';
import { getLatestProxyHealth, getProxyHealthSamples } from '@/app/lib/proxy-health-store';
import { UsageDashboard } from './usage-dashboard';

function usageLimitBytes() {
  const gb = Number(process.env.PROXY_USAGE_30D_LIMIT_GB ?? '1024');
  const safeGb = Number.isFinite(gb) && gb > 0 ? gb : 1024;
  return safeGb * 1024 ** 3;
}

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function latestStatusSample(payload: ProxyHealthPayload): ProxyHealthSample | null {
  const checkedAt = payload.checked_at;
  if (typeof checkedAt !== 'string') return null;

  return {
    checkedAt,
    rxBytes: numberOrNull(payload.wireguard?.rx_bytes),
    txBytes: numberOrNull(payload.wireguard?.tx_bytes),
    publicLatencyMs: numberOrNull(payload.latency?.public_ms),
    wgLatencyMs: numberOrNull(payload.latency?.wg_ms),
    shanghaiBandwagonMs: numberOrNull(payload.globalping?.bandwagon_ms),
    shanghaiLinodeMs: numberOrNull(payload.globalping?.linode_ms),
    mode: typeof payload.mode === 'string' ? payload.mode : null,
  };
}

export async function UsageDashboardContainer() {
  await connection();

  const [status, samples] = await Promise.all([
    getLatestProxyHealth('bandwagon-la'),
    getProxyHealthSamples('bandwagon-la', 35),
  ]);

  if (!status) {
    return (
      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <h2 className="text-xl font-bold">No report yet</h2>
      </div>
    );
  }

  const fallbackSample = latestStatusSample(status.payload);
  const visibleSamples = samples.length > 0 || !fallbackSample ? samples : [fallbackSample];

  return <UsageDashboard samples={visibleSamples} limitBytes={usageLimitBytes()} />;
}
