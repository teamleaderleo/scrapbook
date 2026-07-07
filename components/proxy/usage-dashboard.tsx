import type { ProxyHealthPayload, ProxyHealthSample } from '@/app/lib/proxy-health-store';
import type { ReactNode } from 'react';

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

function tone(status: string | undefined) {
  if (status === 'active' || status === 'normal') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  if (status === 'fallback') return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  if (status === 'inactive' || status === 'failed' || status === 'degraded') return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
  return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300';
}

function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-background/80 p-5 shadow-sm backdrop-blur">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <section className="rounded-2xl border bg-background/80 p-5 shadow-sm backdrop-blur">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {sub ? <div className="mt-2 text-xs text-muted-foreground">{sub}</div> : null}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function total(sample: ProxyHealthSample) {
  if (typeof sample.rxBytes !== 'number' || typeof sample.txBytes !== 'number') return null;
  return sample.rxBytes + sample.txBytes;
}

function floorHour(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));
}

function floorDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function hourLabel(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: 'UTC' });
}

function buildUsage(samples: ProxyHealthSample[]) {
  const usable = samples
    .map((sample) => ({ date: new Date(sample.checkedAt), bytes: total(sample) }))
    .filter((sample): sample is { date: Date; bytes: number } => typeof sample.bytes === 'number' && !Number.isNaN(sample.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const latest = usable.at(-1);
  const latestDate = latest?.date ?? new Date();
  const dayStart = floorDay(new Date(latestDate.getTime() - 6 * 24 * 60 * 60 * 1000));
  const hourStart = floorHour(new Date(latestDate.getTime() - 23 * 60 * 60 * 1000));

  const daily = new Map<string, Bucket>();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(dayStart.getTime() + i * 24 * 60 * 60 * 1000);
    daily.set(dayKey(date), { label: dayLabel(date), bytes: 0 });
  }

  const hourly: Bucket[] = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(hourStart.getTime() + index * 60 * 60 * 1000);
    return { label: hourLabel(date), bytes: 0 };
  });

  for (let i = 1; i < usable.length; i += 1) {
    const previous = usable[i - 1];
    const current = usable[i];
    const delta = current.bytes - previous.bytes;
    if (delta <= 0) continue;

    const bucket = daily.get(dayKey(current.date));
    if (bucket) bucket.bytes += delta;

    if (current.date >= hourStart) {
      const hourIndex = Math.floor((floorHour(current.date).getTime() - hourStart.getTime()) / 3600000);
      if (hourIndex >= 0 && hourIndex < hourly.length) hourly[hourIndex].bytes += delta;
    }
  }

  const days = Array.from(daily.values());
  return {
    total: latest?.bytes ?? 0,
    today: days.at(-1)?.bytes ?? 0,
    week: days.reduce((sum, bucket) => sum + bucket.bytes, 0),
    days,
    hours: hourly,
    samples: usable.length,
  };
}

function BarChart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.bytes));

  return (
    <div className="space-y-3">
      {buckets.map((bucket) => (
        <div key={bucket.label} className="grid grid-cols-[4rem_1fr_5.5rem] items-center gap-3 text-sm">
          <div className="text-xs text-muted-foreground">{bucket.label}</div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground/70" style={{ width: `${Math.max(3, (bucket.bytes / max) * 100)}%` }} />
          </div>
          <div className="text-right text-xs tabular-nums text-muted-foreground">{formatBytes(bucket.bytes)}</div>
        </div>
      ))}
    </div>
  );
}

export function UsageDashboard({ payload, samples, updatedAt }: { payload: ProxyHealthPayload; samples: ProxyHealthSample[]; updatedAt?: string }) {
  const services = payload.services ?? {};
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  const mode = typeof payload.mode === 'string' ? payload.mode : 'unknown';
  const sidecarOk = payload.egress?.sidecar_ok === true;
  const fallbackOk = payload.egress?.fallback_ok === true;
  const ipv4Expected = payload.egress?.ipv4 === payload.expected?.ipv4;
  const ipv6Expected = payload.egress?.ipv6 === payload.expected?.ipv6;
  const usage = buildUsage(samples);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Today" value={formatBytes(usage.today)} sub={`${usage.samples} samples`} />
        <Stat label="Last 7 days" value={formatBytes(usage.week)} />
        <Stat label="Total" value={formatBytes(usage.total)} sub="current counter" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Last 24 hours"><BarChart buckets={usage.hours} /></Card>
        <Card title="Last 7 days"><BarChart buckets={usage.days} /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Status">
          <Row label="Mode" value={<Pill className={tone(mode)}>{mode}</Pill>} />
          <Row label="IPv4 expected" value={ipv4Expected ? 'yes' : 'no'} />
          <Row label="IPv6 expected" value={ipv6Expected ? 'yes' : 'no'} />
          <Row label="Updated" value={updatedAt ? new Date(updatedAt).toLocaleString() : 'unknown'} />
        </Card>
        <Card title="Services">
          {['xray', 'wg-egress-netns', 'xray-wg-sidecar', 'lightsail-egress-socks'].map((name) => (
            <Row key={name} label={name} value={<Pill className={tone(services[name])}>{services[name] ?? 'unknown'}</Pill>} />
          ))}
        </Card>
        <Card title="Fallback">
          <Row label="WG sidecar" value={<Pill className={sidecarOk ? tone('active') : tone('failed')}>{sidecarOk ? 'ok' : 'failed'}</Pill>} />
          <Row label="SSH fallback" value={<Pill className={fallbackOk ? tone('active') : tone('failed')}>{fallbackOk ? 'ready' : 'failed'}</Pill>} />
          <Row label="Errors" value={errors.length === 0 ? 'none' : `${errors.length}`} />
        </Card>
      </div>
    </div>
  );
}
