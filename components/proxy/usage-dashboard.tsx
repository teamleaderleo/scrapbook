import type { ProxyHealthPayload, ProxyHealthSample } from '@/app/lib/proxy-health-store';

type Bucket = { label: string; bytes: number };

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

function sampleTotal(sample: ProxyHealthSample) {
  if (typeof sample.rxBytes !== 'number' || typeof sample.txBytes !== 'number') return null;
  return sample.rxBytes + sample.txBytes;
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

function buildUsage(samples: ProxyHealthSample[]) {
  const usable = samples
    .map((sample) => ({ date: new Date(sample.checkedAt), bytes: sampleTotal(sample) }))
    .filter((sample): sample is { date: Date; bytes: number } => typeof sample.bytes === 'number' && !Number.isNaN(sample.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const latest = usable.at(-1);
  const latestDate = latest?.date ?? new Date();
  const monthStart = floorUtcDay(new Date(latestDate.getTime() - 29 * 24 * 60 * 60 * 1000));
  const weekStart = floorUtcDay(new Date(latestDate.getTime() - 6 * 24 * 60 * 60 * 1000));
  const dayStart = floorUtcDay(latestDate);
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

  const monthBuckets = Array.from(month.values());
  const weekBuckets = Array.from(week.values());
  const today = month.get(dayKey(dayStart))?.bytes ?? 0;

  return {
    total: latest?.bytes ?? 0,
    today,
    week: weekBuckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
    month: monthBuckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
    monthBuckets,
    weekBuckets,
    dayGroups,
    samples: usable.length,
  };
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/80 px-4 py-3 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
    </div>
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
  const height = 190;
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
    <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Monthly trend</h2>
          <p className="mt-1 text-xs text-muted-foreground">30 daily buckets</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">latest {formatBytes(buckets.at(-1)?.bytes ?? 0)}</div>
      </div>
      <svg className="h-48 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Monthly usage trend">
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
    </div>
  );
}

export function UsageDashboard({ payload, samples, updatedAt }: { payload: ProxyHealthPayload; samples: ProxyHealthSample[]; updatedAt?: string }) {
  const usage = buildUsage(samples);
  const mode = typeof payload.mode === 'string' ? payload.mode : 'unknown';
  const errors = Array.isArray(payload.errors) ? payload.errors.length : 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="Today" value={formatBytes(usage.today)} />
        <MiniStat label="7 days" value={formatBytes(usage.week)} />
        <MiniStat label="30 days" value={formatBytes(usage.month)} />
        <MiniStat label="Total" value={formatBytes(usage.total)} />
        <div className="rounded-xl border bg-background/80 px-4 py-3 shadow-sm">
          <div className="text-xs text-muted-foreground">State</div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span>{mode}</span>
            <span className="text-muted-foreground">{errors ? `${errors} errors` : 'ok'}</span>
          </div>
        </div>
      </div>

      <Trend buckets={usage.monthBuckets} />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">7 days</h2>
            <span className="text-xs text-muted-foreground">{formatBytes(usage.week)}</span>
          </div>
          <Bars buckets={usage.weekBuckets} height="h-24" />
        </div>

        <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">24 hours</h2>
            <span className="text-xs text-muted-foreground">4-hour buckets</span>
          </div>
          <Bars buckets={usage.dayGroups} height="h-24" />
        </div>
      </div>

      <div className="text-right text-xs text-muted-foreground">
        {usage.samples} samples{updatedAt ? ` · updated ${new Date(updatedAt).toLocaleString()}` : ''}
      </div>
    </div>
  );
}
