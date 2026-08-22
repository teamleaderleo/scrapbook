'use client';

import type {
  ProxyHealthSample,
  StoredProxyHealth,
} from '@/app/lib/proxy-health-store';

const DAY_MS = 24 * 60 * 60 * 1000;

type LightsailUsage = {
  usedBytes: number | null;
  limitBytes: number | null;
  resetAt: string | null;
  lastRawAt: string | null;
  source: string | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatBytes(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function formatPercent(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return '—';
  if (value > 0 && value < 1) return '<1%';
  return `${Math.round(value)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const absolute = Math.abs(diffMs);
  const suffix = diffMs >= 0 ? 'ago' : 'from now';
  if (absolute < 60_000) return 'just now';
  if (absolute < 60 * 60 * 1000)
    return `${Math.round(absolute / 60_000)}m ${suffix}`;
  if (absolute < DAY_MS)
    return `${Math.round(absolute / (60 * 60 * 1000))}h ${suffix}`;
  return `${Math.round(absolute / DAY_MS)}d ${suffix}`;
}

function readUsage(status: StoredProxyHealth): LightsailUsage | null {
  const usage = status.payload.provider?.usage;
  if (!usage || usage.source === 'disabled') return null;
  return {
    usedBytes: isFiniteNumber(usage.used_bytes) ? usage.used_bytes : null,
    limitBytes: isFiniteNumber(usage.limit_bytes) ? usage.limit_bytes : null,
    resetAt: typeof usage.reset_at === 'string' ? usage.reset_at : null,
    lastRawAt:
      typeof usage.last_raw_at === 'string' ? usage.last_raw_at : null,
    source: typeof usage.source === 'string' ? usage.source : null,
  };
}

function sampleTotal(sample: ProxyHealthSample) {
  if (!isFiniteNumber(sample.rxBytes) || !isFiniteNumber(sample.txBytes))
    return null;
  return sample.rxBytes + sample.txBytes;
}

function trafficSince(samples: ProxyHealthSample[], windowMs: number) {
  const counters = samples
    .map(sample => ({
      checkedAt: new Date(sample.checkedAt),
      total: sampleTotal(sample),
    }))
    .filter(
      (sample): sample is { checkedAt: Date; total: number } =>
        isFiniteNumber(sample.total) && !Number.isNaN(sample.checkedAt.getTime())
    )
    .sort((left, right) => left.checkedAt.getTime() - right.checkedAt.getTime());

  const latest = counters.at(-1)?.checkedAt;
  if (!latest) return 0;
  const cutoff = latest.getTime() - windowMs;
  let total = 0;

  for (let index = 1; index < counters.length; index += 1) {
    const previous = counters[index - 1];
    const current = counters[index];
    if (current.checkedAt.getTime() < cutoff) continue;
    total +=
      current.total >= previous.total
        ? current.total - previous.total
        : current.total;
  }

  return total;
}

function serviceState(status: StoredProxyHealth, service: string) {
  const value = status.payload.services?.[service];
  return typeof value === 'string' ? value : 'unknown';
}

function UsageRing({ percent }: { percent: number | null }) {
  const value = Math.min(100, Math.max(0, percent ?? 0));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - value / 100);

  return (
    <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 120 120"
        role="img"
        aria-label="Lightsail transfer usage progress"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className="stroke-[#8d8af1]"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tracking-tight">
          {formatPercent(percent)}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
          used
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="px-4 py-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</div>
    </div>
  );
}

export function LightsailUsageCard({
  status,
  samples,
}: {
  status: StoredProxyHealth;
  samples: ProxyHealthSample[];
}) {
  const usage = readUsage(status);
  if (!usage) return null;

  const used = usage.usedBytes;
  const limit = usage.limitBytes;
  const percent =
    isFiniteNumber(used) && isFiniteNumber(limit) && limit > 0
      ? (used / limit) * 100
      : null;
  const remaining =
    isFiniteNumber(used) && isFiniteNumber(limit)
      ? Math.max(0, limit - used)
      : null;
  const resetTime = usage.resetAt ? Date.parse(usage.resetAt) : Number.NaN;
  const daysLeft = Number.isFinite(resetTime)
    ? Math.max(1, Math.ceil((resetTime - Date.now()) / DAY_MS))
    : null;
  const dailyRoom =
    isFiniteNumber(remaining) && isFiniteNumber(daysLeft)
      ? remaining / daysLeft
      : null;
  const traffic24h = trafficSince(samples, DAY_MS);
  const xray = serviceState(status, 'xray');
  const hysteria = serviceState(status, 'hysteria-server');
  const errors = Array.isArray(status.payload.errors)
    ? status.payload.errors.filter(error => typeof error === 'string')
    : [];
  const healthy = xray === 'active' && hysteria === 'active' && errors.length === 0;
  const checkedAt = usage.lastRawAt ?? status.updatedAt;

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/78">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Lightsail Oregon
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] ${healthy ? 'border-[#8d8af1]/50 bg-[#8d8af1]/12' : 'border-amber-400/50 bg-amber-400/12'}`}
          >
            {healthy ? 'Online' : 'Check services'}
          </span>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
          checked{' '}
          <span className="font-semibold text-foreground">
            {formatRelativeTime(checkedAt)}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative flex min-h-48 items-center gap-4 overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_18%_25%,rgba(141,138,241,0.16),transparent_52%)] p-4 lg:border-b-0 lg:border-r sm:p-6">
          <UsageRing percent={percent} />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Current cycle
            </div>
            <div className="mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-3xl">
              {formatBytes(used)} / {formatBytes(limit)}
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              Reset · {formatDate(usage.resetAt)} · us-west-2
            </div>
            <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              {usage.source === 'lightsail-local-counter'
                ? 'local interface counter'
                : usage.source ?? 'usage source unavailable'}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          <div className="border-b border-border/60 sm:border-r xl:border-b-0">
            <Stat
              label="Remaining"
              value={formatBytes(remaining)}
              detail="of this month's allowance"
            />
          </div>
          <div className="border-b border-border/60 xl:border-b-0 xl:border-r">
            <Stat
              label="24h traffic"
              value={formatBytes(traffic24h)}
              detail="ingress + egress observed"
            />
          </div>
          <div className="border-b border-border/60 sm:border-b-0 sm:border-r">
            <Stat
              label="Daily room"
              value={formatBytes(dailyRoom)}
              detail={daysLeft ? `${daysLeft}d until reset` : 'reset unavailable'}
            />
          </div>
          <div>
            <Stat
              label="Services"
              value={`${xray === 'active' ? 'Xray ✓' : 'Xray ?'} · ${hysteria === 'active' ? 'HY2 ✓' : 'HY2 ?'}`}
              detail={errors.length > 0 ? `${errors.length} reporter warning${errors.length === 1 ? '' : 's'}` : 'TCP + UDP endpoints'}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
