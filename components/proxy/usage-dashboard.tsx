import type { ProxyHealthSample } from '@/app/lib/proxy-health-store';
import type { ReactNode } from 'react';

type Bucket = { label: string; bytes: number };
type MetricBucket = { label: string; value: number | null };
type LatencyPoint = { date: Date; value: number };

const DEFAULT_30_DAY_LIMIT_BYTES = 1024 ** 4;

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
  return `${Math.round(value)} ms`;
}

function formatAdvantage(primary: number | null, egress: number | null) {
  if (typeof primary !== 'number' || typeof egress !== 'number') return '—';
  const delta = Math.round(egress - primary);
  if (delta === 0) return 'even';
  return delta > 0 ? `${delta} ms better` : `${Math.abs(delta)} ms worse`;
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

function buildUsage(samples: ProxyHealthSample[]) {
  const usable = samples
    .map((sample) => ({ date: new Date(sample.checkedAt), bytes: sampleTotal(sample) }))
    .filter((sample): sample is { date: Date; bytes: number } => typeof sample.bytes === 'number' && !Number.isNaN(sample.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const latencySamples = buildLatencyPoints(samples, (sample) => sample.publicLatencyMs ?? sample.wgLatencyMs);
  const shanghaiBandwagonSamples = buildLatencyPoints(samples, (sample) => sample.shanghaiBandwagonMs);
  const shanghaiLinodeSamples = buildLatencyPoints(samples, (sample) => sample.shanghaiLinodeMs);

  const latest = usable.at(-1);
  const latestDate = latest?.date ?? latencySamples.at(-1)?.date ?? shanghaiBandwagonSamples.at(-1)?.date ?? new Date();
  const monthStart = floorUtcDay(new Date(latestDate.getTime() - 29 * 24 * 60 * 60 * 1000));
  const weekStart = floorUtcDay(new Date(latestDate.getTime() - 6 * 24 * 60 * 60 * 1000));
  const hourStart = floorUtcHour(new Date(latestDate.getTime() - 23 * 60 * 60 * 1000));

  const month = new Map<string, Bucket>();
  for (let index = 0; index < 30; index += 1) {
    const date = new Date(monthStart.getTime() + index * 24 * 60 * 60 * 1000);
    month.set(dayKey(date), { label: shortDayLabel(date), bytes: 0 });
  }

  const week = new Map<string, Bucket>();
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStart.getTime() + index * 24 * 60 * 60 * 1000);
    week.set(dayKey(date), { label: dayLabel(date), bytes: 0 });
  }

  const dayGroups: Bucket[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(hourStart.getTime() + index * 4 * 60 * 60 * 1000);
    return { label: hourLabel(date), bytes: 0 };
  });

  const latencyRaw = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(hourStart.getTime() + index * 4 * 60 * 60 * 1000);
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
      const hourIndex = Math.floor((floorUtcHour(current.date).getTime() - hourStart.getTime()) / (4 * 60 * 60 * 1000));
      if (hourIndex >= 0 && hourIndex < dayGroups.length) dayGroups[hourIndex].bytes += delta;
    }
  }

  for (const sample of latencySamples) {
    if (sample.date < hourStart) continue;
    const hourIndex = Math.floor((floorUtcHour(sample.date).getTime() - hourStart.getTime()) / (4 * 60 * 60 * 1000));
    if (hourIndex >= 0 && hourIndex < latencyRaw.length) {
      latencyRaw[hourIndex].total += sample.value;
      latencyRaw[hourIndex].count += 1;
    }
  }

  const monthBuckets = Array.from(month.values());
  const weekBuckets = Array.from(week.values());
  const latencyBuckets: MetricBucket[] = latencyRaw.map((bucket) => ({
    label: bucket.label,
    value: bucket.count > 0 ? bucket.total / bucket.count : null,
  }));

  return {
    day: dayGroups.reduce((sum, bucket) => sum + bucket.bytes, 0),
    week: weekBuckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
    month: monthBuckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
    latency: latestLatency(latencySamples),
    latency1h: averageLatency(latencySamples, latestDate, 60 * 60 * 1000),
    latency24h: averageLatency(latencySamples, latestDate, 24 * 60 * 60 * 1000),
    latency7d: averageLatency(latencySamples, latestDate, 7 * 24 * 60 * 60 * 1000),
    shanghaiBandwagon: latestLatency(shanghaiBandwagonSamples),
    shanghaiLinode: latestLatency(shanghaiLinodeSamples),
    shanghaiBandwagon24h: averageLatency(shanghaiBandwagonSamples, latestDate, 24 * 60 * 60 * 1000),
    shanghaiLinode24h: averageLatency(shanghaiLinodeSamples, latestDate, 24 * 60 * 60 * 1000),
    monthBuckets,
    weekBuckets,
    dayGroups,
    latencyBuckets,
  };
}

function Card({ title, value, children, className = '' }: { title: string; value?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-background/80 p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
        {value ? <div className="text-sm font-medium text-muted-foreground">{value}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Bars({ buckets, height = 'h-24' }: { buckets: Bucket[]; height?: string }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.bytes));

  return (
    <div className={`flex ${height} items-end gap-1 rounded-xl border bg-muted/30 p-3`}>
      {buckets.map((bucket, index) => {
        const isLatest = index === buckets.length - 1;
        const barHeight = `${Math.max(bucket.bytes === 0 ? 2 : 8, (bucket.bytes / max) * 100)}%`;
        return (
          <div key={`${bucket.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <div className="flex h-full w-full items-end justify-center">
              <div
                className={`w-full max-w-8 rounded-t-md ${isLatest ? 'bg-foreground' : 'bg-foreground/55'}`}
                style={{ height: barHeight }}
                title={`${bucket.label}: ${formatBytes(bucket.bytes)}`}
              />
            </div>
            <div className="truncate text-center text-[10px] text-muted-foreground">{bucket.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Trend({ buckets }: { buckets: Bucket[] }) {
  const width = 900;
  const height = 175;
  const paddingX = 24;
  const paddingY = 18;
  const max = Math.max(1, ...buckets.map((bucket) => bucket.bytes));
  const step = buckets.length > 1 ? (width - paddingX * 2) / (buckets.length - 1) : 0;
  const points = buckets.map((bucket, index) => {
    const x = paddingX + index * step;
    const y = height - paddingY - (bucket.bytes / max) * (height - paddingY * 2);
    return `${x},${y}`;
  });
  const area = `${paddingX},${height - paddingY} ${points.join(' ')} ${width - paddingX},${height - paddingY}`;

  return (
    <svg className="h-44 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="30 day usage trend">
      <polygon points={area} className="fill-foreground/10" />
      <polyline points={points.join(' ')} fill="none" className="stroke-foreground" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {buckets.map((bucket, index) => {
        if (index % 5 !== 0 && index !== buckets.length - 1) return null;
        const x = paddingX + index * step;
        return (
          <text key={`${bucket.label}-${index}`} x={x} y={height - 2} textAnchor="middle" className="fill-muted-foreground text-[10px]">
            {bucket.label}
          </text>
        );
      })}
    </svg>
  );
}

function MetricLine({ buckets }: { buckets: MetricBucket[] }) {
  const width = 900;
  const height = 120;
  const paddingX = 24;
  const paddingY = 16;
  const valid = buckets
    .map((bucket, index) => ({ ...bucket, index }))
    .filter((bucket): bucket is MetricBucket & { value: number; index: number } => typeof bucket.value === 'number' && Number.isFinite(bucket.value));

  if (valid.length === 0) {
    return <div className="flex h-28 items-center justify-center rounded-xl border bg-muted/30 text-xs text-muted-foreground">no data</div>;
  }

  const max = Math.max(1, ...valid.map((bucket) => bucket.value));
  const min = Math.min(...valid.map((bucket) => bucket.value));
  const range = Math.max(1, max - min);
  const step = buckets.length > 1 ? (width - paddingX * 2) / (buckets.length - 1) : 0;
  const points = valid.map((bucket) => {
    const x = paddingX + bucket.index * step;
    const y = height - paddingY - ((bucket.value - min) / range) * (height - paddingY * 2);
    return `${x},${y}`;
  });

  return (
    <svg className="h-28 w-full overflow-visible rounded-xl border bg-muted/30 p-2" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Latency trend">
      <polyline points={points.join(' ')} fill="none" className="stroke-foreground" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {buckets.map((bucket, index) => {
        if (index % 2 !== 0 && index !== buckets.length - 1) return null;
        const x = paddingX + index * step;
        return (
          <text key={`${bucket.label}-${index}`} x={x} y={height - 2} textAnchor="middle" className="fill-muted-foreground text-[10px]">
            {bucket.label}
          </text>
        );
      })}
    </svg>
  );
}

function LatencyStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{formatMs(value)}</div>
    </div>
  );
}

function EdgeStat({ label, value, average }: { label: string; value: number | null; average: number | null }) {
  return (
    <div className="rounded-lg border bg-background/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{formatMs(value)}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">24h {formatMs(average)}</div>
    </div>
  );
}

function LatencyCard({
  latency,
  latency1h,
  latency24h,
  latency7d,
  shanghaiBandwagon,
  shanghaiLinode,
  shanghaiBandwagon24h,
  shanghaiLinode24h,
  buckets,
}: {
  latency: number | null;
  latency1h: number | null;
  latency24h: number | null;
  latency7d: number | null;
  shanghaiBandwagon: number | null;
  shanghaiLinode: number | null;
  shanghaiBandwagon24h: number | null;
  shanghaiLinode24h: number | null;
  buckets: MetricBucket[];
}) {
  return (
    <Card className="lg:col-span-2" title="Latency">
      <div className="grid gap-3 xl:grid-cols-[300px_230px_minmax(0,1fr)]">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="text-xs font-medium text-muted-foreground">Edge · City</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <EdgeStat label="Primary" value={shanghaiBandwagon} average={shanghaiBandwagon24h} />
            <EdgeStat label="Egress" value={shanghaiLinode} average={shanghaiLinode24h} />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Primary {formatAdvantage(shanghaiBandwagon, shanghaiLinode)}</div>
        </div>

        <div className="flex min-h-28 flex-col justify-center rounded-xl border bg-muted/30 px-4">
          <div className="text-3xl font-semibold tracking-tight">{formatMs(latency)}</div>
          <div className="mt-1 text-xs text-muted-foreground">server path latest</div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <LatencyStat label="1h" value={latency1h} />
            <LatencyStat label="24h" value={latency24h} />
            <LatencyStat label="7d" value={latency7d} />
          </div>
        </div>

        <MetricLine buckets={buckets} />
      </div>
    </Card>
  );
}

function UsageRing({ used, limit }: { used: number; limit: number }) {
  const safeLimit = limit > 0 ? limit : DEFAULT_30_DAY_LIMIT_BYTES;
  const percent = Math.min(100, Math.max(0, (used / safeLimit) * 100));
  const displayPercent = percent > 0 && percent < 1 ? '<1%' : `${Math.round(percent)}%`;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <Card title="30 days">
      <div className="flex items-center gap-5">
        <svg className="h-44 w-44 shrink-0 -rotate-90" viewBox="0 0 180 180" role="img" aria-label="30 day usage progress">
          <circle cx="90" cy="90" r={radius} fill="none" className="stroke-muted" strokeWidth="16" />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            className="stroke-foreground"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div>
          <div className="text-4xl font-semibold tracking-tight">{displayPercent}</div>
          <div className="mt-2 text-sm text-muted-foreground">{formatBytes(used)} / {formatBytes(safeLimit)}</div>
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
    <div className="grid gap-3 lg:grid-cols-2">
      <UsageRing used={usage.month} limit={limitBytes} />

      <Card title="30 days" value={formatBytes(usage.month)}>
        <Trend buckets={usage.monthBuckets} />
      </Card>

      <Card title="7 days" value={formatBytes(usage.week)}>
        <Bars buckets={usage.weekBuckets} />
      </Card>

      <Card title="24 hours" value={formatBytes(usage.day)}>
        <Bars buckets={usage.dayGroups} />
      </Card>

      <LatencyCard
        latency={usage.latency}
        latency1h={usage.latency1h}
        latency24h={usage.latency24h}
        latency7d={usage.latency7d}
        shanghaiBandwagon={usage.shanghaiBandwagon}
        shanghaiLinode={usage.shanghaiLinode}
        shanghaiBandwagon24h={usage.shanghaiBandwagon24h}
        shanghaiLinode24h={usage.shanghaiLinode24h}
        buckets={usage.latencyBuckets}
      />
    </div>
  );
}
