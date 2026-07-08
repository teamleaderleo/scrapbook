"use client";

import type { ProxyHealthPayload, ProxyHealthSample, StoredProxyHealth } from '@/app/lib/proxy-health-store';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

type RangeKey = '24h' | '7d' | '30d';
type Bucket = { label: string; bytes: number };
type MetricBucket = { label: string; value: number | null };
type ProviderBucket = { checkedAt: string; bytes: number };
type ProviderUsage = {
  usedBytes: number | null;
  limitBytes: number | null;
  resetAt: string | null;
  suspended: boolean | null;
  policyViolation: boolean | null;
  lastRawAt: string | null;
  daily: ProviderBucket[];
  hourly: ProviderBucket[];
};
type LatencyPoint = { date: Date; value: number };
type LocalUsage = {
  monthBuckets: Bucket[];
  weekBuckets: Bucket[];
  dayBuckets: Bucket[];
  lastDelta: number;
  latestCheckedAt: string | null;
  latestMode: string | null;
  primary: number | null;
  relay: number | null;
  totalLatency: number | null;
  primary24h: number | null;
  totalLatency24h: number | null;
  latencyBuckets: MetricBucket[];
};
type Activity = {
  monthBuckets: Bucket[];
  weekBuckets: Bucket[];
  dayBuckets: Bucket[];
  month: number;
  week: number;
  day: number;
  lastDelta: number;
  source: 'provider' | 'local';
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

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

function formatMs(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return '—';
  return value > 0 && value < 10 ? `${value.toFixed(1)} ms` : `${Math.round(value)} ms`;
}

function formatPercent(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return '—';
  if (value > 0 && value < 1) return '<1%';
  return `${Math.round(value)}%`;
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const absMs = Math.abs(diffMs);
  const suffix = diffMs >= 0 ? 'ago' : 'from now';
  if (absMs < 60 * 1000) return 'just now';
  if (absMs < HOUR_MS) return `${Math.round(absMs / (60 * 1000))}m ${suffix}`;
  if (absMs < DAY_MS) return `${Math.round(absMs / HOUR_MS)}h ${suffix}`;
  return `${Math.round(absMs / DAY_MS)}d ${suffix}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function redacted(text: string) {
  return text
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]')
    .replace(/\b(?:[0-9a-f]{0,4}:){2,}[0-9a-f]{0,4}\b/gi, '[ip]');
}

function safeErrors(payload: ProxyHealthPayload | undefined) {
  const errors = payload?.errors;
  if (!Array.isArray(errors)) return [];
  return errors.filter((error): error is string => typeof error === 'string').map(redacted);
}

function sum(values: Bucket[]) {
  return values.reduce((total, bucket) => total + bucket.bytes, 0);
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

function dayLabel(date: Date, short = false) {
  return date.toLocaleDateString('en-US', short ? { day: 'numeric', timeZone: 'UTC' } : { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function hourLabel(date: Date) {
  return String(date.getUTCHours()).padStart(2, '0');
}

function sumMs(...values: Array<number | null | undefined>) {
  let total = 0;
  for (const value of values) {
    if (!isFiniteNumber(value)) return null;
    total += value;
  }
  return total;
}

function providerRows(value: unknown): ProviderBucket[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as { checked_at?: unknown; bytes?: unknown };
      if (typeof row.checked_at !== 'string' || !isFiniteNumber(row.bytes)) return null;
      const date = new Date(row.checked_at);
      if (Number.isNaN(date.getTime())) return null;
      return { checkedAt: date.toISOString(), bytes: row.bytes };
    })
    .filter((item): item is ProviderBucket => item !== null)
    .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
}

function providerUsage(payload: ProxyHealthPayload | undefined): ProviderUsage | null {
  const usage = payload?.provider?.usage;
  if (!usage || usage.source === 'disabled') return null;
  return {
    usedBytes: isFiniteNumber(usage.used_bytes) ? usage.used_bytes : null,
    limitBytes: isFiniteNumber(usage.limit_bytes) ? usage.limit_bytes : null,
    resetAt: typeof usage.reset_at === 'string' ? usage.reset_at : null,
    suspended: typeof usage.suspended === 'boolean' ? usage.suspended : null,
    policyViolation: typeof usage.policy_violation === 'boolean' ? usage.policy_violation : null,
    lastRawAt: typeof usage.last_raw_at === 'string' ? usage.last_raw_at : null,
    daily: providerRows(usage.daily),
    hourly: providerRows(usage.hourly),
  };
}

function providerPercent(provider: ProviderUsage | null) {
  if (!provider || !isFiniteNumber(provider.usedBytes) || !isFiniteNumber(provider.limitBytes) || provider.limitBytes <= 0) return null;
  return Math.min(100, Math.max(0, (provider.usedBytes / provider.limitBytes) * 100));
}

function providerSummary(provider: ProviderUsage | null) {
  if (!provider || !isFiniteNumber(provider.usedBytes) || !isFiniteNumber(provider.limitBytes)) return '—';
  return `${formatBytes(provider.usedBytes)} / ${formatBytes(provider.limitBytes)}`;
}

function providerAttention(provider: ProviderUsage | null) {
  return Boolean(provider?.suspended || provider?.policyViolation);
}

function dailyRoom(provider: ProviderUsage | null) {
  if (!provider || !isFiniteNumber(provider.usedBytes) || !isFiniteNumber(provider.limitBytes) || !provider.resetAt) return null;
  const reset = new Date(provider.resetAt).getTime();
  if (!Number.isFinite(reset)) return null;
  const daysLeft = Math.max(1, Math.ceil((reset - Date.now()) / DAY_MS));
  return Math.max(0, provider.limitBytes - provider.usedBytes) / daysLeft;
}

function sampleTotal(sample: ProxyHealthSample) {
  if (!isFiniteNumber(sample.rxBytes) || !isFiniteNumber(sample.txBytes)) return null;
  return sample.rxBytes + sample.txBytes;
}

function averageLatency(points: LatencyPoint[], latestDate: Date, windowMs: number) {
  const values = points.filter((point) => point.date.getTime() >= latestDate.getTime() - windowMs).map((point) => point.value);
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildLatencyPoints(samples: ProxyHealthSample[], getValue: (sample: ProxyHealthSample) => number | null) {
  return samples
    .map((sample) => ({ date: new Date(sample.checkedAt), value: getValue(sample) }))
    .filter((point): point is LatencyPoint => isFiniteNumber(point.value) && !Number.isNaN(point.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function latestDateFrom(...groups: LatencyPoint[][]) {
  const values = groups.flatMap((group) => group.map((point) => point.date.getTime())).filter(Number.isFinite);
  return values.length > 0 ? new Date(Math.max(...values)) : new Date();
}

function buildLocalUsage(samples: ProxyHealthSample[]): LocalUsage {
  const counters = samples
    .map((sample) => ({ date: new Date(sample.checkedAt), total: sampleTotal(sample), mode: sample.mode }))
    .filter((point): point is { date: Date; total: number; mode: string | null } => isFiniteNumber(point.total) && !Number.isNaN(point.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const primaryPoints = buildLatencyPoints(samples, (sample) => sample.shanghaiBandwagonMs);
  const relayPoints = buildLatencyPoints(samples, (sample) => sample.wgLatencyMs);
  const totalPoints = buildLatencyPoints(samples, (sample) => sumMs(sample.shanghaiBandwagonMs, sample.wgLatencyMs));
  const latest = counters.at(-1)?.date ?? latestDateFrom(primaryPoints, relayPoints, totalPoints);
  const monthStart = floorUtcDay(new Date(latest.getTime() - 29 * DAY_MS));
  const weekStart = floorUtcDay(new Date(latest.getTime() - 6 * DAY_MS));
  const hourStart = floorUtcHour(new Date(latest.getTime() - 23 * HOUR_MS));

  const month = new Map<string, Bucket>();
  const week = new Map<string, Bucket>();
  const dayBuckets = Array.from({ length: 24 }, (_, index) => ({ label: hourLabel(new Date(hourStart.getTime() + index * HOUR_MS)), bytes: 0 }));
  const latencyRaw = Array.from({ length: 24 }, (_, index) => ({ label: hourLabel(new Date(hourStart.getTime() + index * HOUR_MS)), total: 0, count: 0 }));

  for (let index = 0; index < 30; index += 1) {
    const date = new Date(monthStart.getTime() + index * DAY_MS);
    month.set(dayKey(date), { label: dayLabel(date, true), bytes: 0 });
  }
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStart.getTime() + index * DAY_MS);
    week.set(dayKey(date), { label: dayLabel(date), bytes: 0 });
  }

  let lastDelta = 0;
  for (let index = 1; index < counters.length; index += 1) {
    const previous = counters[index - 1];
    const current = counters[index];
    const delta = current.total - previous.total;
    if (delta <= 0) continue;
    lastDelta = delta;
    const key = dayKey(current.date);
    const monthBucket = month.get(key);
    const weekBucket = week.get(key);
    if (monthBucket) monthBucket.bytes += delta;
    if (weekBucket) weekBucket.bytes += delta;
    const hourIndex = Math.floor((floorUtcHour(current.date).getTime() - hourStart.getTime()) / HOUR_MS);
    if (hourIndex >= 0 && hourIndex < dayBuckets.length) dayBuckets[hourIndex].bytes += delta;
  }

  for (const point of totalPoints) {
    const hourIndex = Math.floor((floorUtcHour(point.date).getTime() - hourStart.getTime()) / HOUR_MS);
    if (hourIndex >= 0 && hourIndex < latencyRaw.length) {
      latencyRaw[hourIndex].total += point.value;
      latencyRaw[hourIndex].count += 1;
    }
  }

  const primary = primaryPoints.at(-1)?.value ?? null;
  const relay = relayPoints.at(-1)?.value ?? null;

  return {
    monthBuckets: Array.from(month.values()),
    weekBuckets: Array.from(week.values()),
    dayBuckets,
    lastDelta,
    latestCheckedAt: counters.at(-1)?.date.toISOString() ?? null,
    latestMode: counters.at(-1)?.mode ?? null,
    primary,
    relay,
    totalLatency: sumMs(primary, relay),
    primary24h: averageLatency(primaryPoints, latest, DAY_MS),
    totalLatency24h: averageLatency(totalPoints, latest, DAY_MS),
    latencyBuckets: latencyRaw.map((bucket) => ({ label: bucket.label, value: bucket.count > 0 ? bucket.total / bucket.count : null })),
  };
}

function providerDailyBuckets(provider: ProviderUsage | null, count: number, longLabels: boolean) {
  if (!provider || provider.daily.length === 0) return [];
  return provider.daily.slice(-count).map((bucket) => {
    const date = new Date(bucket.checkedAt);
    return { label: dayLabel(date, !longLabels), bytes: bucket.bytes };
  });
}

function providerHourlyBuckets(provider: ProviderUsage | null) {
  if (!provider || provider.hourly.length === 0) return [];
  return provider.hourly.slice(-24).map((bucket) => ({ label: hourLabel(new Date(bucket.checkedAt)), bytes: bucket.bytes }));
}

function buildActivity(local: LocalUsage, provider: ProviderUsage | null): Activity {
  const month = providerDailyBuckets(provider, 30, false);
  const week = providerDailyBuckets(provider, 7, true);
  const day = providerHourlyBuckets(provider);
  const monthBuckets = month.length > 0 ? month : local.monthBuckets;
  const weekBuckets = week.length > 0 ? week : local.weekBuckets;
  const dayBuckets = day.length > 0 ? day : local.dayBuckets;

  return {
    monthBuckets,
    weekBuckets,
    dayBuckets,
    month: sum(monthBuckets),
    week: sum(weekBuckets),
    day: sum(dayBuckets),
    lastDelta: dayBuckets.at(-1)?.bytes ?? local.lastDelta,
    source: month.length > 0 || week.length > 0 || day.length > 0 ? 'provider' : 'local',
  };
}

function paceLabel(room: number | null, weeklyAverage: number) {
  if (!isFiniteNumber(room) || room <= 0) return 'pace unknown';
  if (weeklyAverage > room * 1.15) return 'pace warm';
  return 'pace safe';
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

function PinnedValue({ value }: { value: string | null }) {
  if (!value) return null;
  return <div className="absolute left-2 top-2 z-10 rounded-full border bg-background/95 px-2 py-1 text-[11px] shadow-sm backdrop-blur">{value}</div>;
}

function Bars({ buckets, height = 'h-28', labelEvery = 1, minBarPercent = 14 }: { buckets: Bucket[]; height?: string; labelEvery?: number; minBarPercent?: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const max = Math.max(1, ...buckets.map((bucket) => bucket.bytes));

  return (
    <div className={`relative grid ${height} grid-rows-[minmax(0,1fr)_auto] gap-1 rounded-lg border bg-muted/30 p-2`}>
      <PinnedValue value={selected} />
      <div className="flex min-h-0 items-end gap-1">
        {buckets.map((bucket, index) => {
          const hasValue = bucket.bytes > 0;
          const tooltip = `${bucket.label}: ${formatBytes(bucket.bytes)}`;
          const heightValue = hasValue ? `${Math.max(minBarPercent, (bucket.bytes / max) * 100)}%` : '2px';
          return (
            <button
              key={`${bucket.label}-${index}`}
              type="button"
              className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-md px-0.5 transition-colors hover:bg-[#b8b5ff]/10 focus:bg-[#b8b5ff]/10 focus:outline-none focus:ring-1 focus:ring-[#cbc8ff]"
              onClick={() => setSelected((current) => current === tooltip ? null : tooltip)}
              title={tooltip}
              aria-label={tooltip}
            >
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-background px-2 py-1 text-[11px] shadow-sm group-hover:block group-focus:block">{tooltip}</div>
              <span
                className={`block w-full max-w-10 rounded-t transition-all duration-150 ${hasValue ? 'bg-[#b8b5ff] shadow-[0_0_14px_rgba(184,181,255,0.26)] group-hover:bg-[#cbc8ff]' : 'bg-[#b8b5ff]/25 group-hover:bg-[#b8b5ff]/40'}`}
                style={{ height: heightValue }}
              />
            </button>
          );
        })}
      </div>
      <div className="flex gap-1">
        {buckets.map((bucket, index) => {
          const show = index % labelEvery === 0 || index === buckets.length - 1;
          return <div key={`${bucket.label}-${index}`} className="min-w-0 flex-1 text-center text-[10px] leading-none text-muted-foreground"><span className="whitespace-nowrap">{show ? bucket.label : ''}</span></div>;
        })}
      </div>
    </div>
  );
}

function MetricBars({ buckets }: { buckets: MetricBucket[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const values = buckets.map((bucket) => bucket.value).filter(isFiniteNumber);
  if (values.length === 0) return <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/30 text-xs text-muted-foreground">no data</div>;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  const padding = spread > 0 ? Math.max(spread * 0.15, 0.2) : Math.max(max * 0.002, 0.5);
  const lower = min - padding;
  const upper = max + padding;
  const range = Math.max(0.1, upper - lower);

  return (
    <div className="relative grid h-24 grid-cols-[minmax(0,1fr)_2.25rem] grid-rows-[minmax(0,1fr)_auto] gap-x-1 gap-y-1 rounded-lg border bg-muted/30 p-2">
      <PinnedValue value={selected} />
      <div className="flex min-h-0 items-end gap-1">
        {buckets.map((bucket, index) => {
          const value = bucket.value;
          const hasValue = isFiniteNumber(value);
          const normalized = hasValue ? Math.min(1, Math.max(0, (value - lower) / range)) : 0;
          const tooltip = `${bucket.label}: ${formatMs(value)}`;
          return (
            <button
              key={`${bucket.label}-${index}`}
              type="button"
              className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-md px-0.5 transition-colors hover:bg-[#b8b5ff]/10 focus:bg-[#b8b5ff]/10 focus:outline-none focus:ring-1 focus:ring-[#cbc8ff]"
              onClick={() => setSelected((current) => current === tooltip ? null : tooltip)}
              title={tooltip}
              aria-label={tooltip}
            >
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-background px-2 py-1 text-[11px] shadow-sm group-hover:block group-focus:block">{tooltip}</div>
              <span
                className={`block w-full max-w-10 rounded-t transition-all duration-150 ${hasValue ? 'bg-[#b8b5ff] shadow-[0_0_14px_rgba(184,181,255,0.26)] group-hover:bg-[#cbc8ff]' : 'bg-[#b8b5ff]/25'}`}
                style={{ height: hasValue ? `${Math.max(14, normalized * 100)}%` : '2px' }}
              />
            </button>
          );
        })}
      </div>
      <div className="row-span-2 flex flex-col justify-between text-right text-[9px] leading-none text-muted-foreground"><span>{formatMs(upper)}</span><span>{formatMs(lower)}</span></div>
      <div className="flex gap-1">
        {buckets.map((bucket, index) => <div key={`${bucket.label}-${index}`} className="min-w-0 flex-1 text-center text-[10px] leading-none text-muted-foreground">{index % 4 === 0 || index === buckets.length - 1 ? bucket.label : ''}</div>)}
      </div>
    </div>
  );
}

function StatusPill({ mode, errors }: { mode: string | null; errors: string[] }) {
  const warning = errors.length > 0 || mode === 'degraded' || mode === 'unknown';
  const fallback = mode === 'fallback';
  const label = errors.length > 0 ? 'Needs attention' : fallback ? 'Backup path' : warning ? 'Degraded' : 'Normal';
  const className = warning ? 'border-red-400/50 bg-red-400/15' : fallback ? 'border-amber-400/50 bg-amber-400/15' : 'border-[#b8b5ff]/50 bg-[#b8b5ff]/15';
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium text-foreground ${className}`}>{label}</span>;
}

function mood(mode: string | null, errors: string[], activity: Activity, latency: number | null) {
  if (errors.length > 0 || mode === 'degraded' || mode === 'unknown') return 'fussy';
  if (mode === 'fallback') return 'backup';
  if (isFiniteNumber(latency) && latency > 220) return 'slow';
  if (activity.day > Math.max(activity.week / 7, 1) * 2.5) return 'busy';
  if (activity.day < 1024 * 1024) return 'sleepy';
  return 'calm';
}

function ProviderRing({ provider }: { provider: ProviderUsage | null }) {
  const percent = providerPercent(provider) ?? 0;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" role="img" aria-label="provider usage progress">
        <circle cx="60" cy="60" r={radius} fill="none" className="stroke-muted" strokeWidth="11" />
        <circle cx="60" cy="60" r={radius} fill="none" className="stroke-[#b8b5ff]" strokeWidth="11" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold tracking-tight">{formatPercent(percent)}</div>
    </div>
  );
}

function Hero({ status, local, activity, provider }: { status?: StoredProxyHealth | null; local: LocalUsage; activity: Activity; provider: ProviderUsage | null }) {
  const payload = status?.payload;
  const errors = safeErrors(payload);
  const mode = payload?.mode ?? local.latestMode;
  const room = dailyRoom(provider);
  const weeklyAverage = activity.week / 7;
  const attention = providerAttention(provider);
  const checkedAt = provider?.lastRawAt ?? status?.updatedAt ?? local.latestCheckedAt;

  return (
    <section className="rounded-2xl border bg-background/90 p-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusPill mode={mode ?? null} errors={errors} />
          <span className="text-xs font-medium text-muted-foreground">{mood(mode ?? null, errors, activity, local.totalLatency)}</span>
          {attention ? <span className="rounded-full border border-red-400/50 bg-red-400/15 px-2 py-0.5 text-xs text-foreground">attention</span> : null}
        </div>
        <div className="text-xs text-muted-foreground">checked <span className="font-medium text-foreground">{formatRelativeTime(checkedAt)}</span></div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
        <div className="flex min-h-36 items-center gap-4 rounded-xl border bg-muted/30 p-3">
          <ProviderRing provider={provider} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Provider cycle</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{providerSummary(provider)}</div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>resets {formatDate(provider?.resetAt)}</span>
              <span>{activity.source === 'provider' ? 'provider buckets' : 'local fallback'}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="rounded-xl border bg-muted/30 px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">24h</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{formatBytes(activity.day)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">latest hour {formatBytes(activity.lastDelta)}</div>
          </div>
          <div className="rounded-xl border bg-muted/30 px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Room / day</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{formatBytes(room)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">7d avg {formatBytes(weeklyAverage)} · {paceLabel(room, weeklyAverage)}</div>
          </div>
          <div className="rounded-xl border bg-muted/30 px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Latency</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{formatMs(local.totalLatency)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">24h {formatMs(local.totalLatency24h)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BandwidthCard({ activity }: { activity: Activity }) {
  const [range, setRange] = useState<RangeKey>('30d');
  const options: Array<{ key: RangeKey; label: string; buckets: Bucket[]; value: number; labelEvery: number; minBarPercent: number }> = [
    { key: '24h', label: '24 hours', buckets: activity.dayBuckets, value: activity.day, labelEvery: 4, minBarPercent: 18 },
    { key: '7d', label: '7 days', buckets: activity.weekBuckets, value: activity.week, labelEvery: 1, minBarPercent: 14 },
    { key: '30d', label: '30 days', buckets: activity.monthBuckets, value: activity.month, labelEvery: 5, minBarPercent: 18 },
  ];
  const selected = options.find((option) => option.key === range) ?? options[2];

  return (
    <Card className="xl:col-span-4" title="Bandwidth" value={formatBytes(selected.value)}>
      <div className="mb-3 flex rounded-full border bg-muted/30 p-1 text-xs font-medium">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setRange(option.key)}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${range === option.key ? 'bg-[#b8b5ff]/25 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <Bars buckets={selected.buckets} height="h-44" labelEvery={selected.labelEvery} minBarPercent={selected.minBarPercent} />
    </Card>
  );
}

function LatencyCard({ local }: { local: LocalUsage }) {
  return (
    <Card className="xl:col-span-4" title="Latency">
      <div className="grid gap-2 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-2">
          <div className="rounded-lg border bg-background/50 px-3 py-2"><div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Primary</div><div className="mt-0.5 text-lg font-semibold tracking-tight">{formatMs(local.primary)}</div><div className="mt-0.5 text-[11px] text-muted-foreground">24h {formatMs(local.primary24h)}</div></div>
          <div className="rounded-lg border bg-background/50 px-3 py-2"><div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Egress</div><div className="mt-0.5 text-lg font-semibold tracking-tight">{formatMs(local.relay)}</div><div className="mt-0.5 text-[11px] text-muted-foreground">relay</div></div>
          <div className="rounded-lg border bg-background/50 px-3 py-2"><div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Total</div><div className="mt-0.5 text-lg font-semibold tracking-tight">{formatMs(local.totalLatency)}</div><div className="mt-0.5 text-[11px] text-muted-foreground">24h {formatMs(local.totalLatency24h)}</div></div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Primary + Egress · 24h</div>
          <MetricBars buckets={local.latencyBuckets} />
        </div>
      </div>
    </Card>
  );
}

export function UsageDashboard({ samples, status }: { samples: ProxyHealthSample[]; status?: StoredProxyHealth | null; limitBytes?: number }) {
  const provider = providerUsage(status?.payload);
  const local = useMemo(() => buildLocalUsage(samples), [samples]);
  const activity = useMemo(() => buildActivity(local, provider), [local, provider]);

  return (
    <div className="grid gap-3 xl:grid-cols-4">
      <div className="xl:col-span-4"><Hero status={status} local={local} activity={activity} provider={provider} /></div>
      <BandwidthCard activity={activity} />
      <LatencyCard local={local} />
    </div>
  );
}
