import { connection } from 'next/server';

import type { ProxyHealthPayload, ProxyHealthSample } from '@/app/lib/proxy-health-store';
import { readProxyHealth } from '@/app/lib/proxy-health-store';
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

function formatTimestamp(value: string | null) {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}

function reportAge(checkedAt: string | null) {
  if (!checkedAt) return { label: 'Unknown', stale: true };
  const checked = new Date(checkedAt).getTime();
  if (!Number.isFinite(checked)) return { label: 'Unknown', stale: true };

  const ageMs = Math.max(0, Date.now() - checked);
  const staleAfterMinutes = Number(process.env.PROXY_HEALTH_STALE_AFTER_MINUTES ?? '15');
  const staleAfterMs = (Number.isFinite(staleAfterMinutes) && staleAfterMinutes > 0 ? staleAfterMinutes : 15) * 60_000;
  const minutes = Math.floor(ageMs / 60_000);
  const label = minutes < 1 ? 'Under a minute' : minutes < 60 ? `${minutes} minutes` : `${Math.floor(minutes / 60)} hours`;
  return { label, stale: ageMs > staleAfterMs };
}

function StateCard({ title, body, requestId }: { title: string; body: string; requestId?: string }) {
  return (
    <section className="rounded-2xl border bg-background p-5 shadow-sm" role="status">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {requestId ? <p className="mt-3 font-mono text-xs text-muted-foreground">Request {requestId}</p> : null}
    </section>
  );
}

export async function UsageDashboardContainer() {
  await connection();

  const result = await readProxyHealth('bandwagon-la', 35);

  if (result.status === 'configuration-error') {
    return <StateCard title="Proxy configuration missing" body={result.message} requestId={result.requestId} />;
  }

  if (result.status === 'error') {
    return <StateCard title="Proxy data unavailable" body={result.message} requestId={result.requestId} />;
  }

  if (result.status === 'empty') {
    return <StateCard title="No report has arrived" body="The database connection succeeded, but this host has no stored report yet." />;
  }

  const { report, samples } = result;
  const fallbackSample = latestStatusSample(report.payload);
  const visibleSamples = samples.length > 0 || !fallbackSample ? samples : [fallbackSample];
  const age = reportAge(report.checkedAt);

  return (
    <div className="space-y-3">
      <section className="rounded-xl border bg-background/80 px-4 py-3 shadow-sm" aria-label="Proxy report freshness">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Report freshness</p>
            <p className="mt-1 text-sm">
              Age <span className="font-medium">{age.label}</span>
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              age.stale ? 'border-amber-500/45 bg-amber-500/12' : 'border-emerald-500/45 bg-emerald-500/12'
            }`}
          >
            {age.stale ? 'Stale' : 'Current'}
          </span>
        </div>
        <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <div>
            <dt>Payload checked_at</dt>
            <dd className="mt-0.5 font-mono text-foreground">{formatTimestamp(report.checkedAt)}</dd>
          </div>
          <div>
            <dt>Row updated_at</dt>
            <dd className="mt-0.5 font-mono text-foreground">{formatTimestamp(report.updatedAt)}</dd>
          </div>
        </dl>
      </section>
      <UsageDashboard samples={visibleSamples} status={report} limitBytes={usageLimitBytes()} />
    </div>
  );
}
