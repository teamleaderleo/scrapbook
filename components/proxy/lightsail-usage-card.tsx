import type { LightsailAwsSnapshot } from '@/app/lib/lightsail-aws';

const DAY_MS = 24 * 60 * 60 * 1000;

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

function formatUsd(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return '—';
  return `$${value.toFixed(value < 10 ? 2 : 1)}`;
}

function formatGb(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return '—';
  return `${value.toFixed(value < 10 ? 2 : 1)} GB`;
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

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
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

function endpointLabel(data: LightsailAwsSnapshot) {
  const tcp = data.ports.tcp443 ? 'TCP443 ✓' : 'TCP443 ?';
  const udp = data.ports.udp443 ? 'UDP443 ✓' : 'UDP443 ?';
  return `${tcp} · ${udp}`;
}

function planLabel(data: LightsailAwsSnapshot) {
  const pieces = [
    isFiniteNumber(data.plan.priceUsd) ? `$${data.plan.priceUsd}/mo` : null,
    isFiniteNumber(data.plan.ramGb) ? `${data.plan.ramGb} GB RAM` : null,
    isFiniteNumber(data.plan.cpuCount) ? `${data.plan.cpuCount} vCPU` : null,
  ].filter((piece): piece is string => Boolean(piece));
  return pieces.join(' · ') || data.plan.bundleId || '—';
}

export function LightsailUsageCard({ data }: { data: LightsailAwsSnapshot }) {
  const allowance = data.transfer.allowanceBytes;
  const percent =
    isFiniteNumber(allowance) && allowance > 0
      ? (data.transfer.usedBytes / allowance) * 100
      : null;
  const checkedTime = Date.parse(data.checkedAt);
  const resetTime = Date.parse(data.transfer.resetAt);
  const daysLeft =
    Number.isFinite(resetTime) && Number.isFinite(checkedTime)
      ? Math.max(1, Math.ceil((resetTime - checkedTime) / DAY_MS))
      : null;
  const dailyRoom =
    isFiniteNumber(data.transfer.remainingBytes) && isFiniteNumber(daysLeft)
      ? data.transfer.remainingBytes / daysLeft
      : null;
  const running = data.state === 'running';
  const statusHealthy =
    running &&
    data.statusCheckFailures24h === 0 &&
    data.ports.tcp443 &&
    data.ports.udp443;
  const billingTransfer = data.billing
    ? `billing in ${formatGb(data.billing.transferInGb)} · out ${formatGb(data.billing.transferOutGb)} · overage ${formatGb(data.billing.overageOutGb)}`
    : data.billingError
      ? 'Cost Explorer permission unavailable'
      : 'Cost Explorer unavailable';

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/78">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Lightsail Oregon
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] ${statusHealthy ? 'border-[#8d8af1]/50 bg-[#8d8af1]/12' : 'border-amber-400/50 bg-amber-400/12'}`}
          >
            {running ? 'AWS online' : (data.state ?? 'AWS state unknown')}
          </span>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
          AWS checked{' '}
          <span className="font-semibold text-foreground">
            {formatRelativeTime(data.checkedAt)}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="relative flex min-h-52 items-center gap-4 overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_18%_25%,rgba(141,138,241,0.16),transparent_52%)] p-4 lg:border-b-0 lg:border-r sm:p-6">
          <UsageRing percent={percent} />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              AWS transfer · current month
            </div>
            <div className="mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-3xl">
              {formatBytes(data.transfer.usedBytes)} / {formatBytes(allowance)}
            </div>
            <div className="mt-1.5 text-xs leading-5 text-muted-foreground">
              In {formatBytes(data.transfer.networkInBytes)} · Out{' '}
              {formatBytes(data.transfer.networkOutBytes)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Reset · {formatDate(data.transfer.resetAt)} · {data.region}
              {data.availabilityZone ? ` · ${data.availabilityZone}` : ''}
            </div>
            <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              {data.poolSize > 1
                ? `${data.poolSize} matching bundle instances pooled`
                : '1 instance · AWS Lightsail metrics'}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3">
          <div className="border-b border-border/60 sm:border-r">
            <Stat
              label="Remaining"
              value={formatBytes(data.transfer.remainingBytes)}
              detail={`${formatBytes(dailyRoom)} / day · ${daysLeft ?? '—'}d to reset`}
            />
          </div>
          <div className="border-b border-border/60 xl:border-r">
            <Stat
              label="24h traffic"
              value={formatBytes(data.transfer.last24hBytes)}
              detail={`in ${formatBytes(data.transfer.last24hInBytes)} · out ${formatBytes(data.transfer.last24hOutBytes)}`}
            />
          </div>
          <div className="border-b border-border/60 sm:border-r xl:border-r-0">
            <Stat
              label="CPU · 24h"
              value={formatPercent(data.cpu.average24h)}
              detail={`peak ${formatPercent(data.cpu.maximum24h)}`}
            />
          </div>
          <div className="border-b border-border/60 xl:border-b-0 xl:border-r">
            <Stat
              label="Burst capacity"
              value={formatPercent(data.burst.latestPercent)}
              detail={`24h avg ${formatPercent(data.burst.average24h)} · peak ${formatPercent(data.burst.maximum24h)}`}
            />
          </div>
          <div className="border-b border-border/60 sm:border-b-0 sm:border-r">
            <Stat
              label="Plan"
              value={planLabel(data)}
              detail={`${data.plan.diskGb ?? '—'} GB SSD · pool × ${data.poolSize}`}
            />
          </div>
          <div>
            <Stat
              label="Endpoints"
              value={endpointLabel(data)}
              detail={`${data.staticIp ? 'static IPv4' : 'dynamic IPv4'} · status failures ${data.statusCheckFailures24h ?? '—'}`}
            />
          </div>
        </div>
      </div>

      <div className="grid border-t border-border/60 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="border-b border-border/60 px-4 py-3 sm:border-b-0 sm:border-r">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
            Billing MTD
          </span>{' '}
          <span className="font-semibold text-foreground">
            {formatUsd(data.billing?.costUsd)}
          </span>{' '}
          · {billingTransfer}
          {data.billing?.estimated ? ' · estimated' : ''}
        </div>
        <div className="px-4 py-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
            Instance
          </span>{' '}
          <span className="font-semibold text-foreground">{data.instanceName}</span>
          {data.blueprintName ? ` · ${data.blueprintName}` : ''}
          {data.publicIpAddress ? ` · ${data.publicIpAddress}` : ''}
        </div>
      </div>
    </section>
  );
}
