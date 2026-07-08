"use client";

import type { ProxyHealthPayload, ProxyHealthSample, StoredProxyHealth } from '@/app/lib/proxy-health-store';
import type { ReactNode } from 'react';
import { useState } from 'react';

type Bucket = { label: string; bytes: number };
type MetricBucket = { label: string; value: number | null };
type CounterPoint = { date: Date; total: number; mode: string | null };
type LatencyPoint = { date: Date; value: number };
type ProviderUsage = {
  usedBytes: number | null;
  limitBytes: number | null;
  resetAt: string | null;
  suspended: boolean | null;
  policyViolation: boolean | null;
};

type UsageModel = {
  day: number;
  week: number;
  month: number;
  lastDelta: number;
  sampleCount: number;
  latestCheckedAt: string | null;
  latestMode: string | null;
  primary: number | null;
  relay: number | null;
  primaryPlusEgress: number | null;
  primary24h: number | null;
  estimated24h: number | null;
  monthBuckets: Bucket[];
  weekBuckets: Bucket[];
  dayBuckets: Bucket[];
  estimatedBuckets: MetricBucket[];
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function last<T>(items: T[]) {
  return items.length > 0 ? items[items.length - 1] : undefined;
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
  if (value > 0 && value < 10) return `${value.toFixed(1)} ms`;
  return `${Math.round(value)} ms`;
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

function formatUtcDate(value: string | null | undefined) {
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

function providerUsage(payload: ProxyHealthPayload | undefined): ProviderUsage | null {
  const usage = payload?.provider?.usage;
  if (!usage || usage.source === 'disabled') return null;

  return {
    usedBytes: isFiniteNumber(usage.used_bytes) ? usage.used_bytes : null,
    limitBytes: isFiniteNumber(usage.limit_bytes) ? usage.limit_bytes : null,
    resetAt: typeof usage.reset_at === 'string' ? usage.reset_at : null,
    suspended: typeof usage.suspended === 'boolean' ? usage.suspended : null,
    policyViolation: typeof usage.policy_violation === 'boolean' ? usage.policy_violation : null,
  };
}

function providerPercent(provider: ProviderUsage | null) {
  if (!provider) return null;
  const { usedBytes, limitBytes } = provider;
  if (!isFiniteNumber(usedBytes) || !isFiniteNumber(limitBytes) || limitBytes <= 0) return null;
  return Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100));
}

function providerSummary(provider: ProviderUsage | null) {
  if (!provider) return '—';
  const { usedBytes, limitBytes } = provider;
  if (!isFiniteNumber(usedBytes) || !isFiniteNumber(limitBytes)) return '—';
  return `${formatBytes(usedBytes)} / ${formatBytes(limitBytes)}`;
}

function providerNeedsAttention(provider: ProviderUsage | null) {
  return Boolean(provider?.suspended || provider?.policyViolation);
}

function sumMs(...values: Array<number | null | undefined>) {
  let total = 0;
  for (const value of values) {
    if (!isFiniteNumber(value)) return null;
    total += value;
  }
  return total;
}

function sampleTotal(sample: ProxyHealthSample) {
  if (!isFiniteNumber(sample.rxBytes) || !isFiniteNumber(sample.txBytes)) return null;
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
  return String(date.getUTCHours()).padStart(2, '0');
}

function average(points: LatencyPoint[], latestDate: Date, windowMs: number) {
  const start = latestDate.getTime() - windowMs;
  const values = points.filter((point) => point.date.getTime() >= start).map((point) => point.value);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildLatencyPoints(samples: ProxyHealthSample[], valueForSample: (sample: ProxyHealthSample) => number | null) {
  return samples
    .map((sample) => ({ date: new Date(sample.checkedAt), value: valueForSample(sample) }))
    .filter((point): point is LatencyPoint => isFiniteNumber(point.value) && !Number.isNaN(point.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function latestDate(counterPoints: CounterPoint[], latencyGroups: LatencyPoint[][]) {
  const values = [
    ...counterPoints.map((point) => point.date.getTime()),
    ...latencyGroups.flatMap((group) => group.map((point) => point.date.getTime())),
  ].filter(Number.isFinite);
  return values.length > 0 ? new Date(Math.max(...values)) : new Date();
}

function buildUsage(samples: ProxyHealthSample[]): UsageModel {
  const counterPoints = samples
    .map((sample) => ({ date: new Date(sample.checkedAt), total: sampleTotal(sample), mode: sample.mode }))
    .filter((point): point is CounterPoint => isFiniteNumber(point.total) && !Number.isNaN(point.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const primaryPoints = buildLatencyPoints(samples, (sample) => sample.shanghaiBandwagonMs);
  const relayPoints = buildLatencyPoints(samples, (sample) => sample.wgLatencyMs);
  const estimatedPoints = buildLatencyPoints(samples, (sample) => sumMs(sample.shanghaiBandwagonMs, sample.wgLatencyMs));
  const latest = latestDate(counterPoints, [primaryPoints, relayPoints, estimatedPoints]);

  const monthStart = floorUtcDay(new Date(latest.getTime() - 29 * DAY_MS));
  const weekStart = floorUtcDay(new Date(latest.getTime() - 6 * DAY_MS));
  const hourStart = floorUtcHour(new Date(latest.getTime() - 23 * HOUR_MS));

  const month = new Map<string, Bucket>();
  const week = new Map<string, Bucket>();
  const dayBuckets = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(hourStart.getTime() + index * HOUR_MS);
    return { label: hourLabel(date), bytes: 0 };
  });
  const estimatedRaw = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(hourStart.getTime() + index * HOUR_MS);
    return { label: hourLabel(date), total: 0, count: 0 };
  });

  for (let index = 0; index < 30; index += 1) {
    const date = new Date(monthStart.getTime() + index * DAY_MS);
    month.set(dayKey(date), { label: shortDayLabel(date), bytes: 0 });
  }

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStart.getTime() + index * DAY_MS);
    week.set(dayKey(date), { label: dayLabel(date), bytes: 0 });
  }

  let lastDelta = 0;
  for (let index = 1; index < counterPoints.length; index += 1) {
    const previous = counterPoints[index - 1];
    const current = counterPoints[index];
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

  for (const point of estimatedPoints) {
    const hourIndex = Math.floor((floorUtcHour(point.date).getTime() - hourStart.getTime()) / HOUR_MS);
    if (hourIndex < 0 || hourIndex >= estimatedRaw.length) continue;
    estimatedRaw[hourIndex].total += point.value;
    estimatedRaw[hourIndex].count += 1;
  }

  const monthBuckets = Array.from(month.values());
  const weekBuckets = Array.from(week.values());
  const estimatedBuckets = estimatedRaw.map((bucket) => ({
    label: bucket.label,
    value: bucket.count > 0 ? bucket.total / bucket.count : null,
  }));

  const latestPrimary = last(primaryPoints)?.value ?? null;
  const latestRelay = last(relayPoints)?.value ?? null;
  const latestCounter = last(counterPoints);

  return {
    day: dayBuckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
    week: weekBuckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
    month: monthBuckets.reduce((sum, bucket) => sum + bucket.bytes, 0),
    lastDelta,
    sampleCount: samples.length,
    latestCheckedAt: latestCounter?.date.toISOString() ?? null,
    latestMode: latestCounter?.mode ?? null,
    primary: latestPrimary,
    relay: latestRelay,
    primaryPlusEgress: sumMs(latestPrimary, latestRelay),
    primary24h: average(primaryPoints, latest, DAY_MS),
    estimated24h: average(estimatedPoints, latest, DAY_MS),
    monthBuckets,
    weekBuckets,
    dayBuckets,
    estimatedBuckets,
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

function PinnedValue({ value }: { value: string | null }) {
  if (!value) return null;
  return <div className="absolute left-2 top-2 z-10 rounded-full border bg-background/95 px-2 py-1 text-[11px] shadow-sm backdrop-blur">{value}</div>;
}

function Tooltip({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-background px-2 py-1 text-[11px] shadow-sm group-hover:block group-focus:block">
      {text}
    </div>
  );
}

function BarFill({ hasValue, isLatest, height, wide = false }: { hasValue: boolean; isLatest: boolean; height: string; wide?: boolean }) {
  const widthClass = wide ? 'max-w-10' : 'max-w-8';
  const activeClass = hasValue || isLatest
    ? 'bg-[#b8b5ff] shadow-[0_0_14px_rgba(184,181,255,0.26)] group-hover:bg-[#cbc8ff] group-hover:shadow-[0_0_20px_rgba(203,200,255,0.48)] group-focus:bg-[#cbc8ff] group-focus:shadow-[0_0_20px_rgba(203,200,255,0.48)]'
    : 'bg-[#b8b5ff]/25 group-hover:bg-[#b8b5ff]/40 group-focus:bg-[#b8b5ff]/40';

  return <span className={`block w-full ${widthClass} rounded-t transition-all duration-150 ${activeClass}`} style={{ height }} />;
}

function BucketLabel({ label, show }: { label: string; show: boolean }) {
  return (
    <div className="min-w-0 flex-1 overflow-visible text-center text-[10px] leading-none text-muted-foreground">
      <span className="inline-block whitespace-nowrap">{show ? label : ''}</span>
    </div>
  );
}

function Bars({ buckets, height = 'h-20', labelEvery = 1, wideBars = false, minBarPercent = 14 }: { buckets: Bucket[]; height?: string; labelEvery?: number; wideBars?: boolean; minBarPercent?: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const max = Math.max(1, ...buckets.map((bucket) => bucket.bytes));

  return (
    <div className={`relative grid ${height} grid-rows-[minmax(0,1fr)_auto] gap-1 overflow-visible rounded-lg border bg-muted/30 p-2`}>
      <PinnedValue value={selected} />
      <div className="flex min-h-0 items-end gap-1 overflow-visible">
        {buckets.map((bucket, index) => {
          const isLatest = index === buckets.length - 1;
          const hasValue = bucket.bytes > 0;
          const barHeight = hasValue ? `${Math.max(minBarPercent, (bucket.bytes / max) * 100)}%` : '2px';
          const tooltip = `${bucket.label}: ${formatBytes(bucket.bytes)}`;
          return (
            <button
              key={`${bucket.label}-${index}`}
              type="button"
              onClick={() => setSelected((current) => current === tooltip ? null : tooltip)}
              className="group relative flex h-full min-w-0 flex-1 cursor-help items-end justify-center rounded-md px-0.5 transition-colors hover:bg-[#b8b5ff]/10 focus:bg-[#b8b5ff]/10 focus:outline-none focus:ring-1 focus:ring-[#cbc8ff]"
              title={tooltip}
              aria-label={tooltip}
            >
              <Tooltip text={tooltip} />
              <BarFill hasValue={hasValue} isLatest={isLatest} height={barHeight} wide={wideBars} />
            </button>
          );
        })}
      </div>
      <div className="flex gap-1 overflow-visible">
        {buckets.map((bucket, index) => {
          const isLatest = index === buckets.length - 1;
          return <BucketLabel key={`${bucket.label}-${index}`} label={bucket.label} show={index % labelEvery === 0 || isLatest} />;
        })}
      </div>
    </div>
  );
}

function MetricBars({ buckets, labelEvery = 4 }: { buckets: MetricBucket[]; labelEvery?: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const values = buckets.map((bucket) => bucket.value).filter(isFiniteNumber);

  if (values.length === 0) {
    return <div className="flex h-20 items-center justify-center rounded-lg border bg-muted/30 text-xs text-muted-foreground">no data</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  const padding = spread > 0 ? Math.max(spread * 0.15, 0.2) : Math.max(max * 0.002, 0.5);
  const lower = min - padding;
  const upper = max + padding;
  const range = Math.max(0.1, upper - lower);

  return (
    <div className="relative grid h-24 grid-cols-[minmax(0,1fr)_2.25rem] grid-rows-[minmax(0,1fr)_auto] gap-x-1 gap-y-1 overflow-visible rounded-lg border bg-muted/30 p-2">
      <PinnedValue value={selected} />
      <div className="flex min-h-0 items-end gap-1 overflow-visible">
        {buckets.map((bucket, index) => {
          const isLatest = index === buckets.length - 1;
          const value = bucket.value;
          const hasValue = isFiniteNumber(value);
          const normalized = hasValue ? Math.min(1, Math.max(0, (value - lower) / range)) : 0;
          const barHeight = hasValue ? `${Math.max(14, normalized * 100)}%` : '2px';
          const tooltip = `${bucket.label}: ${formatMs(value)}`;
          return (
            <button
              key={`${bucket.label}-${index}`}
              type="button"
              onClick={() => setSelected((current) => current === tooltip ? null : tooltip)}
              className="group relative flex h-full min-w-0 flex-1 cursor-help items-end justify-center rounded-md px-0.5 transition-colors hover:bg-[#b8b5ff]/10 focus:bg-[#b8b5ff]/10 focus:outline-none focus:ring-1 focus:ring-[#cbc8ff]"
              title={tooltip}
              aria-label={tooltip}
            >
              <Tooltip text={tooltip} />
              <BarFill hasValue={hasValue} isLatest={isLatest} height={barHeight} wide />
            </button>
          );
        })}
      </div>
      <div className="row-span-2 flex flex-col justify-between text-right text-[9px] leading-none text-muted-foreground">
        <span>{formatMs(upper)}</span>
        <span>{formatMs(lower)}</span>
      </div>
      <div className="flex gap-1 overflow-visible">
        {buckets.map((bucket, index) => {
          const isLatest = index === buckets.length - 1;
          return <BucketLabel key={`${bucket.label}-${index}`} label={bucket.label} show={index % labelEvery === 0 || isLatest} />;
        })}
      </div>
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

function statusTone(mode: string | null, errors: string[]) {
  if (errors.length > 0 || mode === 'degraded' || mode === 'unknown') return 'issue';
  if (mode === 'fallback') return 'backup';
  return 'ok';
}

function statusLabel(mode: string | null, errors: string[]) {
  if (errors.length > 0) return 'Needs attention';
  if (mode === 'fallback') return 'Backup path';
  if (mode === 'degraded') return 'Degraded';
  if (mode === 'unknown') return 'Unknown';
  return 'Normal';
}

function proxyMood(mode: string | null, errors: string[], usageBytes: number, latencyMs: number | null) {
  if (errors.length > 0 || mode === 'degraded' || mode === 'unknown') return 'fussy';
  if (mode === 'fallback') return 'backup';
  if (isFiniteNumber(latencyMs) && latencyMs > 220) return 'slow';
  if (usageBytes < 1024 * 1024) return 'sleepy';
  return 'calm';
}

function StatusPill({ mode, errors }: { mode: string | null; errors: string[] }) {
  const tone = statusTone(mode, errors);
  const className = tone === 'ok'
    ? 'border-[#b8b5ff]/50 bg-[#b8b5ff]/15 text-foreground'
    : tone === 'backup'
      ? 'border-amber-400/50 bg-amber-400/15 text-foreground'
      : 'border-red-400/50 bg-red-400/15 text-foreground';

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{statusLabel(mode, errors)}</span>;
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
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className="stroke-[#b8b5ff]"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold tracking-tight">{formatPercent(percent)}</div>
    </div>
  );
}

function ProviderSummary({ status, usage, provider }: { status?: StoredProxyHealth | null; usage: UsageModel; provider: ProviderUsage | null }) {
  const payload = status?.payload;
  const errors = safeErrors(payload);
  const mode = payload?.mode ?? usage.latestMode;
  const attention = providerNeedsAttention(provider);

  return (
    <section className="rounded-2xl border bg-background/90 p-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusPill mode={mode ?? null} errors={errors} />
          <span className="text-xs font-medium text-muted-foreground">{proxyMood(mode ?? null, errors, usage.day, usage.primaryPlusEgress)}</span>
          {attention ? <span className="rounded-full border border-red-400/50 bg-red-400/15 px-2 py-0.5 text-xs text-foreground">attention</span> : null}
        </div>
        <div className="text-xs text-muted-foreground">checked <span className="font-medium text-foreground">{formatRelativeTime(status?.updatedAt ?? usage.latestCheckedAt)}</span></div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
        <div className="flex min-h-36 items-center gap-4 rounded-xl border bg-muted/30 p-3">
          <ProviderRing provider={provider} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Provider cycle</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{providerSummary(provider)}</div>
            <div className="mt-1 text-xs text-muted-foreground">resets {formatUtcDate(provider?.resetAt)}</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="rounded-xl border bg-muted/30 px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">24h</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{formatBytes(usage.day)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">last {formatBytes(usage.lastDelta)}</div>
          </div>

          <div className="rounded-xl border bg-muted/30 px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Latency</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{formatMs(usage.primaryPlusEgress)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">24h {formatMs(usage.estimated24h)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LatencyCard({ usage }: { usage: UsageModel }) {
  return (
    <Card className="xl:col-span-4" title="Latency">
      <div className="grid gap-2 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-2">
          <MiniStat label="Primary" value={usage.primary} note={`24h ${formatMs(usage.primary24h)}`} />
          <MiniStat label="Egress" value={usage.relay} note="relay" />
          <MiniStat label="Total" value={usage.primaryPlusEgress} note={`24h ${formatMs(usage.estimated24h)}`} />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Primary + Egress · 24h</div>
          <MetricBars buckets={usage.estimatedBuckets} labelEvery={4} />
        </div>
      </div>
    </Card>
  );
}

export function UsageDashboard({
  samples,
  status,
}: {
  samples: ProxyHealthSample[];
  status?: StoredProxyHealth | null;
  limitBytes?: number;
}) {
  const usage = buildUsage(samples);
  const provider = providerUsage(status?.payload);

  return (
    <div className="grid gap-3 xl:grid-cols-4">
      <div className="xl:col-span-4">
        <ProviderSummary status={status} usage={usage} provider={provider} />
      </div>

      <Card className="xl:col-span-2" title="30 days" value={formatBytes(usage.month)}>
        <Bars buckets={usage.monthBuckets} height="h-32" labelEvery={5} minBarPercent={18} />
      </Card>

      <Card title="7 days" value={formatBytes(usage.week)}>
        <Bars buckets={usage.weekBuckets} height="h-32" />
      </Card>

      <Card title="24 hours" value={formatBytes(usage.day)}>
        <Bars buckets={usage.dayBuckets} height="h-32" labelEvery={4} wideBars minBarPercent={18} />
      </Card>

      <LatencyCard usage={usage} />
    </div>
  );
}
