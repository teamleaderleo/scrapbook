import type { ProxyHealthSample } from '@/app/lib/proxy-health-store';
import type { ReactNode } from 'react';

type Bucket = { label: string; bytes: number };
type MetricBucket = { label: string; value: number | null };
type LatencyPoint = { date: Date; value: number };

const DEFAULT_30_DAY_LIMIT_BYTES = 1024 ** 4;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const LEGACY_EXTERNAL_LATENCY_FLOOR_MS = 10;

function formatBytes(value: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number.isFinite(value) ? value : 0;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function formatMs(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (value > 0 && value < 10) return `${value.toFixed(1)} ms`;
  return `${Math.round(value)} ms`;
}

function sumMs(...values: Array<number | null | undefined>) {
  let total = 0;
  for (const value of values) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    total += value;
  }
  return total;
}

function sampleTotal(sample: ProxyHealthSample) {
  if (typeof sample.rxBytes !== 'number' || typeof sample.txBytes !== 'number') return null;
  return sample.rxBytes + sample.txBytes;
}

function averageLatency(samples: LatencyPoint[], latestDate: Date, windowMs: number) {
  const start = latestDate.getTime() - windowMs;
  const values = samples.filter((sample) => sample.date.getTime() >= start).map((sample) => sample.value);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function latestLatency(samples: LatencyPoint[]) {
  return samples.at(-1)?.value ?? null;
}

function latestDateFrom(...groups: LatencyPoint[][]) {
  const dates = groups.flatMap((group) => group.map((sample) => sample.date.getTime())).filter((value) => Number.isFinite(value));
  return dates.length > 0 ? new Date(Math.max(...dates)) : null;
}

function floorUtcHour(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));
}

function floorUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function shortDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });
}

function hourLabel(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: 'UTC' });
}

function buildLatencyPoints(samples: ProxyHealthSample[], valueForSample: (sample: ProxyHealthSample) => number | null) {
  return samples
    .map((sample) => ({ date: new Date(sample.checkedAt), value: valueForSample(sample) }))
    .filter((sample): sample is LatencyPoint => typeof sample.value === 'number' && Number.isFinite(sample.value) && !Number.isNaN(sample.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function usableExternalLatency(sample: ProxyHealthSample) {
  if (typeof sample.publicLatencyMs !== 'number') return null;
  if (!Number.isFinite(sample.publicLatencyMs)) return null;
  if (sample.publicLatencyMs < LEGACY_EXTERNAL_LATENCY_FLOOR_MS) return null;
  return sample.publicLatencyMs;
}

function buildUsage(samples: ProxyHealthSample[]) {
  const usable = samples
    .map((sample) => ({ date: new Date(sample.checkedAt), bytes: sampleTotal(sample) }))
    .filter((sample): sample is { date: Date; bytes: number } => typeof sample.bytes === 'number' && !Number.isNaN(sample.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const externalSamples = buildLatencyPoints(samples, usableExternalLatency);
  const relaySamples = buildLatencyPoints(samples, (sample) => sample.wgLatencyMs);
  const primarySamples = buildLatencyPoints(samples, (sample) => sample.shanghaiBandwagonMs);

  const latest = usable.at(-1);
  const latestDate = latest?.date ?? latestDateFrom(externalSamples, relaySamples, primarySamples) ?? new Date();
  const monthStart = floorUtcDay(new Date(latestDate.getTime() - 29 * DAY_MS));
  const weekStart = floorUtcDay(new Date(latestDate.getTime() - 6 * DAY_MS));
  const hourStart = floorUtcHour(new Date(latestDate.getTime() - 23 * HOUR_MS));

  const month = new Map<string, Bucket>();
  for (let index = 0; index < 30; index += 1) {
    const date = new Date(monthStart.getTime() + index * DAY_MS);
    month.set(dayKey(date), { label: shortDayLabel(date), bytes: 0 });
  }

  const week = new Map<string, Bucket>();
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStart.getTime() + index * DAY_MS);
    week.set(dayKey(date), { label: dayLabel(date), bytes: 0 });
  }

  const dayGroups: Bucket[] = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(hourStart.getTime() + index * HOUR_MS);
    return { label: hourLabel(date), bytes: 0 };
  });

  const externalRaw = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(hourStart.getTime() + index * HOUR_MS);
    return { label: hourLabel(date), total: 0, count: 0 };
  });

  for (let index = 1; index < usable.length; index += 1) {
    const previous = usable[index - 1];
    const current = usable[index];
    const delta = current.bytes - previous.bytes;
    if (delta <= 0) continue;

    const currentDayKey = dayKey(current.date);
    const monthBucket = month.get(currentDayKey);
    if (monthBucket) monthBucket.bytes += delta;

    const weekBucket = week.get(currentDayKey);
    if (weekBucket) weekBucket.bytes += delta;

    if (current.date >= hourStart) {
      const hourIndex = Math.floor((floorUtcHour(current.date).getTime() - hourStart.getTime()) / HOUR_MS);
      if (hourIndex >= 0 && hourIndex < dayGroups.length) dayGroups[hourIndex].bytes += delta;
    }
  }

  for (const sample of externalSamples) {
    if (sample.date < hourStart) continue;
    const hourIndex = Math.floor((floorUtcHour(sample.date).getTime() - hourStart.getTime()) / HOUR_MS);
    if (hourIndex >= 0 && hourIndex < externalRaw.length) {
      externalRaw[hourIndex].total += sample.value;
      externalRaw[hourIndex].count += 1;
    }
  }

  const monthBuckets = Array.from(month.values());
  const weekBuckets = Array.from(week.values());
  const externalBuckets: MetricBucket[] = externalRaw.map((bucket) => ({
    label: bucket.label,
    value: bucket.count > 0 ? bucket.total / bucket.count : null,
  }));

  const primary = latestLatency(primarySamples);
  const relay = latestLatency(relaySamples);
  const primaryPlusEgress = sumMs(primary, relay);

  return {
    day: dayGroups.reduce((sum, bucket) => sum + bucket.bytes, 0),
    week: weekBuckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
    month: monthBuckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
    external: latestLatency(externalSamples),
    external24h: averageLatency(externalSamples, latestDate, DAY_MS),
    external7d: averageLatency(externalSamples, latestDate, 7 * DAY_MS),
    primary,
    relay,
    primaryPlusEgress,
    primary24h: averageLatency(primarySamples, latestDate, DAY_MS),
    relay24h: averageLatency(relaySamples, latestDate, DAY_MS),
    monthBuckets,
    weekBuckets,
    dayGroups,
    externalBuckets,
  };
}

function Card({ title, value, children, className = '' }: { title: string; value?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-background/80 p-3 shadow-sm ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h2>
        {value ? <div className="text-xs font-medium text-muted-foreground">{value}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Bars({ buckets, height = 'h-20', labelEvery = 1 }: { buckets: Bucket[]; height?: string; labelEvery?: number }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.bytes));

  return (
    <div className={`flex ${height} items-end gap-1 rounded-lg border bg-muted/30 p-2`}>
      {buckets.map((bucket, index) => {
        const isLatest = index === buckets.length - 1;
        const showLabel = index % labelEvery === 0 || isLatest;
        const barHeight = `${Math.max(bucket.bytes === 0 ? 2 : 8, (bucket.bytes / max) * 100)}%`;
        return (
          <div key={`${bucket.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end justify-center">
              <div
                className={`w-full max-w-7 rounded-t ${isLatest ? 'bg-foreground' : 'bg-foreground/55'}`}
                style={{ height: barHeight }}
                title={`${bucket.label}: ${formatBytes(bucket.bytes)}`}
              />
            </div>
            <div className="h-3 truncate text-center text-[9px] text-muted-foreground">{showLabel ? bucket.label : ''}</div>
          </div>
        );
      })}
    </div>
  );
}

function MetricBars({ buckets, labelEvery = 4 }: { buckets: MetricBucket[]; labelEvery?: number }) {
  const validValues = buckets.map((bucket) => bucket.value).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (validValues.length === 0) {
    return <div className="flex h-20 items-center justify-center rounded-lg border bg-muted/30 text-xs text-muted-foreground">no data</div>;
  }

  const max = Math.max(1, ...validValues);

  return (
    <div className="flex h-20 items-end gap-1 rounded-lg border bg-muted/30 p-2">
      {buckets.map((bucket, index) => {
        const isLatest = index === buckets.length - 1;
        const showLabel = index % labelEvery === 0 || isLatest;
        const value = bucket.value;
        const barHeight = typeof value === 'number' && Number.isFinite(value) ? `${Math.max(8, (value / max) * 100)}%` : '2px';
        return (
          <div key={`${bucket.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end justify-center">
              <div
                className={`w-full max-w-7 rounded-t ${isLatest ? 'bg-foreground' : 'bg-foreground/55'}`}
                style={{ height: barHeight }}
                title={`${bucket.label}: ${formatMs(value)}`}
              />
            </div>
            <div className="h-3 truncate text-center text-[9px] text-muted-foreground">{showLabel ? bucket.label : ''}</div>
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({ label, value, note }: { label: string; value: number | null; note?: string }) {
  return (
    <div className="rounded-lg border bg-background/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tracking-tight">{formatMs(value)}</div>
      {note ? <div className="mt-0.5 text-[11px] text-muted-foreground">{note}</div> : null}
    </div>
  );
}

function LatencyCard({
  external,
  external24h,
  external7d,
  primary,
  relay,
  primaryPlusEgress,
  primary24h,
  buckets,
}: {
  external: number | null;
  external24h: number | null;
  external7d: number | null;
  primary: number | null;
  relay: number | null;
  primaryPlusEgress: number | null;
  primary24h: number | null;
  buckets: MetricBucket[];
}) {
  return (
    <Card className="lg:col-span-2" title="Latency">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-xs font-medium text-muted-foreground">Edge · City</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <MiniStat label="Primary" value={primary} note={`24h ${formatMs(primary24h)}`} />
            <MiniStat label="Egress" value={relay} note="relay" />
            <MiniStat label="Primary + Egress" value={primaryPlusEgress} note="estimated" />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-xs font-medium text-muted-foreground">External check</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{formatMs(external)}</div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">24h</div>
              <div className="font-medium">{formatMs(external24h)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">7d</div>
              <div className="font-medium">{formatMs(external7d)}</div>
            </div>
          </div>
        </div>

        <MetricBars buckets={buckets} labelEvery={4} />
      </div>
    </Card>
  );
}

function UsageRing({ used, limit }: { used: number; limit: number }) {
  const safeLimit = limit > 0 ? limit : DEFAULT_30_DAY_LIMIT_BYTES;
  const percent = Math.min(100, Math.max(0, (used / safeLimit) * 100));
  const displayPercent = percent > 0 && percent < 1 ? '<1%' : `${Math.round(percent)}%`;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <Card title="30 days">
      <div className="flex items-center gap-4">
        <svg className="h-32 w-32 shrink-0 -rotate-90" viewBox="0 0 140 140" role="img" aria-label="30 day usage progress">
          <circle cx="70" cy="70" r={radius} fill="none" className="stroke-muted" strokeWidth="14" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            className="stroke-foreground"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div>
          <div className="text-3xl font-semibold tracking-tight">{displayPercent}</div>
          <div className="mt-1 text-xs text-muted-foreground">{formatBytes(used)} / {formatBytes(safeLimit)}</div>
        </div>
      </div>
    </Card>
  );
}

export function UsageDashboard({
  samples,
  limitBytes = DEFAULT_30_DAY_LIMIT_BYTES,
}: {
  samples: ProxyHealthSample[];
  limitBytes?: number;
}) {
  const usage = buildUsage(samples);

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <UsageRing used={usage.month} limit={limitBytes} />

      <Card title="30 days" value={formatBytes(usage.month)}>
        <Bars buckets={usage.monthBuckets} height="h-28" labelEvery={6} />
      </Card>

      <Card title="7 days" value={formatBytes(usage.week)}>
        <Bars buckets={usage.weekBuckets} />
      </Card>

      <Card title="24 hours" value={formatBytes(usage.day)}>
        <Bars buckets={usage.dayGroups} labelEvery={4} />
      </Card>

      <LatencyCard
        external={usage.external}
        external24h={usage.external24h}
        external7d={usage.external7d}
        primary={usage.primary}
        relay={usage.relay}
        primaryPlusEgress={usage.primaryPlusEgress}
        primary24h={usage.primary24h}
        buckets={usage.externalBuckets}
      />
    </div>
  );
}
