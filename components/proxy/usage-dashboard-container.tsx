import { connection } from 'next/server';

import type { ProxyHealthPayload, ProxyHealthSample } from '@/app/lib/proxy-health-store';
import { readProxyHealth } from '@/app/lib/proxy-health-store';
import { UsageDashboard } from './usage-dashboard';

const DAY_MS = 24 * 60 * 60 * 1000;

type UsageValues = {
  used: number | null;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
};

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

function providerUsage(payload: ProxyHealthPayload, fallbackLimit: number): UsageValues {
  const usage = (payload as {
    provider?: {
      usage?: {
        used_bytes?: unknown;
        limit_bytes?: unknown;
        remaining_bytes?: unknown;
        reset_at?: unknown;
      };
    };
  }).provider?.usage;

  const used = numberOrNull(usage?.used_bytes);
  const limit = numberOrNull(usage?.limit_bytes) ?? fallbackLimit;
  const reportedRemaining = numberOrNull(usage?.remaining_bytes);
  const remaining = reportedRemaining ?? (used !== null && limit !== null ? Math.max(0, limit - used) : null);

  return {
    used,
    limit,
    remaining,
    resetAt: typeof usage?.reset_at === 'string' ? usage.reset_at : null,
  };
}

function formatBytes(value: number | null) {
  if (value === null) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function formatPercent(value: number | null) {
  if (value === null) return '—';
  if (value > 0 && value < 1) return '<1%';
  return `${Math.round(value)}%`;
}

function formatReset(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function previousMonthlyReset(reset: Date) {
  const year = reset.getUTCFullYear();
  const month = reset.getUTCMonth();
  const requestedDay = reset.getUTCDate();
  const finalDayOfPreviousMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(
    year,
    month - 1,
    Math.min(requestedDay, finalDayOfPreviousMonth),
    reset.getUTCHours(),
    reset.getUTCMinutes(),
    reset.getUTCSeconds(),
    reset.getUTCMilliseconds(),
  ));
}

function cyclePercent(resetAt: string | null) {
  if (!resetAt) return null;
  const reset = new Date(resetAt);
  if (Number.isNaN(reset.getTime())) return null;
  const start = previousMonthlyReset(reset);
  const span = reset.getTime() - start.getTime();
  if (span <= 0) return null;
  return Math.min(100, Math.max(0, ((Date.now() - start.getTime()) / span) * 100));
}

function quotaPercent(usage: UsageValues) {
  if (usage.used === null || usage.limit === null || usage.limit <= 0) return null;
  return Math.min(100, Math.max(0, (usage.used / usage.limit) * 100));
}

function roomPerDay(usage: UsageValues) {
  if (usage.remaining === null || !usage.resetAt) return null;
  const reset = new Date(usage.resetAt).getTime();
  if (!Number.isFinite(reset)) return null;
  const days = Math.max(1, Math.ceil((reset - Date.now()) / DAY_MS));
  return usage.remaining / days;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-muted/35 px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function ProxyUsageSummary({ payload, fallbackLimit }: { payload: ProxyHealthPayload; fallbackLimit: number }) {
  const usage = providerUsage(payload, fallbackLimit);
  const quota = quotaPercent(usage);
  const cycle = cyclePercent(usage.resetAt);
  const room = roomPerDay(usage);

  return (
    <section className="rounded-2xl border bg-background/90 p-3 shadow-sm" aria-label="Proxy quota and reset cycle">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Quota used"
          value={formatPercent(quota)}
          detail={`${formatBytes(usage.used)} of ${formatBytes(usage.limit)}`}
        />
        <Metric
          label="Cycle elapsed"
          value={formatPercent(cycle)}
          detail="calendar month between provider resets"
        />
        <Metric
          label="Room / day"
          value={formatBytes(room)}
          detail={`${formatBytes(usage.remaining)} remaining`}
        />
        <Metric
          label="Reset"
          value={formatReset(usage.resetAt)}
          detail="provider timestamp · UTC"
        />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2" aria-hidden="true">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-[#8d8299] transition-[width] duration-300 dark:bg-[#b8adc4]" style={{ width: `${quota ?? 0}%` }} />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-[#6f7d77] transition-[width] duration-300 dark:bg-[#9eb0a8]" style={{ width: `${cycle ?? 0}%` }} />
        </div>
      </div>
    </section>
  );
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
  const fallbackLimit = usageLimitBytes();

  return (
    <div className="space-y-3">
      <ProxyUsageSummary payload={report.payload} fallbackLimit={fallbackLimit} />
      <div className="proxy-usage-dashboard">
        <UsageDashboard samples={visibleSamples} status={report} limitBytes={fallbackLimit} />
      </div>
    </div>
  );
}
