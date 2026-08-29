'use client';

import type {
  MachineHealthPayload,
  MachineHealthSample,
} from '@/app/lib/machine-health-store';
import { useMemo, useState } from 'react';

export type ActivityRange = '24h' | '7d' | '30d';

type ActivityBin = {
  start: number;
  end: number;
  sampleCount: number;
  cpuUsedPercent: number | null;
  memoryUsedPercent: number | null;
  graphicsClockMhz: number | null;
  networkMibS: number | null;
  diskMibS: number | null;
  pressurePercent: number | null;
  codexInputTokens: number | null;
  codexCachedInputTokens: number | null;
  codexOutputTokens: number | null;
  codexReasoningOutputTokens: number | null;
  codexModelCalls: number | null;
  codexActiveRoutes: number | null;
  fallbackCount: number;
  undercoveredCount: number;
  rebootCount: number;
  browserRoots: number | null;
  browserRssMib: number | null;
  codexWorkers: number | null;
  routeTaggedProcesses: number | null;
};

const MIB = 1_024 ** 2;

const RANGE_CONFIG: Record<
  ActivityRange,
  { bins: number; binMs: number; description: string }
> = {
  '24h': { bins: 24, binMs: 60 * 60_000, description: 'hourly' },
  '7d': { bins: 7, binMs: 24 * 60 * 60_000, description: 'daily' },
  '30d': { bins: 30, binMs: 24 * 60 * 60_000, description: 'daily' },
};

function average(values: number[]) {
  return values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function sum(values: number[]) {
  return values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0);
}

export function buildActivityBins(
  samples: MachineHealthSample[],
  range: ActivityRange,
  now: number
): ActivityBin[] {
  const { bins, binMs } = RANGE_CONFIG[range];
  const alignedEnd = Math.ceil(now / binMs) * binMs;
  const start = alignedEnd - bins * binMs;
  const ordered = [...samples].sort(
    (left, right) => Date.parse(left.checkedAt) - Date.parse(right.checkedAt)
  );
  const codexByWindow = new Map<string, MachineHealthSample>();
  for (const sample of ordered) {
    if (sample.codexUsageWindowStartedAt)
      codexByWindow.set(sample.codexUsageWindowStartedAt, sample);
  }
  const codexSamples = [...codexByWindow.values()];
  const rebootTimestamps = new Set(
    ordered
      .filter(
        (sample, index) =>
          index > 0 && sample.uptimeSeconds < ordered[index - 1].uptimeSeconds
      )
      .map(sample => sample.checkedAt)
  );

  return Array.from({ length: bins }, (_, index) => {
    const binStart = start + index * binMs;
    const binEnd = binStart + binMs;
    const included = samples.filter(sample => {
      const checkedAt = Date.parse(sample.checkedAt);
      return checkedAt >= binStart && checkedAt < binEnd;
    });
    const graphicsClocks = included
      .map(sample => sample.graphicsClockMhz)
      .filter((value): value is number => value !== null);
    const diskThroughput = included
      .filter(
        sample => sample.diskReadMibS !== null || sample.diskWriteMibS !== null
      )
      .map(sample => (sample.diskReadMibS ?? 0) + (sample.diskWriteMibS ?? 0));
    const pressure = included
      .map(sample => sample.pressurePercent)
      .filter((value): value is number => value !== null);
    const includedCodex = codexSamples.filter(sample => {
      const windowStartedAt = Date.parse(
        sample.codexUsageWindowStartedAt ?? ''
      );
      return windowStartedAt >= binStart && windowStartedAt < binEnd;
    });
    const codexValues = (key: keyof MachineHealthSample) =>
      includedCodex
        .map(sample => sample[key])
        .filter((value): value is number => typeof value === 'number');
    const activeRoutes = codexValues('codexActiveRoutes');

    return {
      start: binStart,
      end: binEnd,
      sampleCount: included.length,
      cpuUsedPercent: average(included.map(sample => sample.cpuUsedPercent)),
      memoryUsedPercent: average(
        included.map(sample => sample.memoryUsedPercent)
      ),
      graphicsClockMhz: average(graphicsClocks),
      networkMibS: average(
        included.map(sample => sample.networkRxMibS + sample.networkTxMibS)
      ),
      diskMibS: average(diskThroughput),
      pressurePercent: pressure.length === 0 ? null : Math.max(...pressure),
      codexInputTokens: sum(codexValues('codexInputTokens')),
      codexCachedInputTokens: sum(codexValues('codexCachedInputTokens')),
      codexOutputTokens: sum(codexValues('codexOutputTokens')),
      codexReasoningOutputTokens: sum(
        codexValues('codexReasoningOutputTokens')
      ),
      codexModelCalls: sum(codexValues('codexModelCalls')),
      codexActiveRoutes:
        activeRoutes.length === 0 ? null : Math.max(...activeRoutes),
      fallbackCount: included.filter(
        sample => sample.activitySource === 'point'
      ).length,
      undercoveredCount: included.filter(
        sample =>
          sample.activitySource === 'sysstat-10m' &&
          (sample.activitySampleCount < 6 || sample.activityWindowMinutes < 55)
      ).length,
      rebootCount: included.filter(sample =>
        rebootTimestamps.has(sample.checkedAt)
      ).length,
      browserRoots:
        included.length === 0
          ? null
          : Math.max(...included.map(sample => sample.browserRoots)),
      browserRssMib:
        included.length === 0
          ? null
          : Math.max(...included.map(sample => sample.browserRssBytes / MIB)),
      codexWorkers:
        included.length === 0
          ? null
          : Math.max(...included.map(sample => sample.codexWorkers)),
      routeTaggedProcesses:
        included.length === 0
          ? null
          : included.some(sample => sample.routeTaggedProcesses !== null)
            ? Math.max(
                ...included.map(sample => sample.routeTaggedProcesses ?? 0)
              )
            : null,
    };
  });
}

function formatValue(value: number | null, unit: string) {
  if (value === null) return '—';
  if (unit === '%')
    return `${value.toFixed(value < 1 ? 2 : value < 10 ? 1 : 0)}%`;
  if (unit === 'MHz') return `${Math.round(value)} MHz`;
  if (unit === 'tokens')
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  if (unit === 'processes')
    return `${Math.round(value)} ${Math.round(value) === 1 ? 'process' : 'processes'}`;
  return `${value.toFixed(value < 10 ? 2 : 1)} ${unit}`;
}

function aggregateValues(
  values: number[],
  summary: 'average' | 'maximum' | 'sum'
) {
  if (values.length === 0) return null;
  if (summary === 'maximum') return Math.max(...values);
  if (summary === 'sum') return sum(values);
  return average(values);
}

function formatDelta(
  current: number | null,
  previous: number | null,
  unit: string
) {
  if (current === null || previous === null) return 'no prior comparison';
  const delta = current - previous;
  const threshold = unit === 'tokens' ? 1 : 0.005;
  if (Math.abs(delta) < threshold) return 'flat vs prior';
  const sign = delta > 0 ? '+' : '−';
  const magnitude = Math.abs(delta);
  if (unit === '%') return `${sign}${magnitude.toFixed(1)} pp vs prior`;
  if (unit === 'tokens')
    return `${sign}${formatValue(magnitude, unit)} vs prior`;
  return `${sign}${formatValue(magnitude, unit)} vs prior`;
}

function ObservationChart({
  label,
  bins,
  previousBins,
  value,
  ceiling,
  unit,
  summary = 'average',
}: {
  label: string;
  bins: ActivityBin[];
  previousBins: ActivityBin[];
  value: (bin: ActivityBin) => number | null;
  ceiling?: number;
  unit: string;
  summary?: 'average' | 'maximum' | 'sum';
}) {
  const values = bins.map(value);
  const present = values.filter((item): item is number => item !== null);
  const previousPresent = previousBins
    .map(value)
    .filter((item): item is number => item !== null);
  const max = Math.max(ceiling ?? 0, ...present, 1);
  const currentSummary = aggregateValues(present, summary);
  const previousSummary = aggregateValues(previousPresent, summary);

  return (
    <article className="bg-white/55 dark:bg-black/15 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-black">{label}</h3>
        <div className="text-right">
          <p className="font-mono text-xs tabular-nums opacity-70">
            {formatValue(currentSummary, unit)}
          </p>
          <p className="opacity-45 mt-0.5 text-[0.62rem] tabular-nums">
            {formatDelta(currentSummary, previousSummary, unit)}
          </p>
        </div>
      </div>
      <div
        className="mt-4 flex h-20 items-end gap-px"
        role="img"
        aria-label={`${label} across ${bins.length} observation bins`}
      >
        {values.map((item, index) => (
          <span
            key={bins[index].start}
            className={`min-w-0 flex-1 rounded-t-[2px] ${
              item === null
                ? 'h-px bg-black/10 dark:bg-white/10'
                : 'bg-[#a53b34] dark:bg-[#e27c72]'
            }`}
            style={
              item === null
                ? undefined
                : { height: `${Math.max(4, (item / max) * 100)}%` }
            }
            title={
              item === null
                ? 'No observation'
                : `${new Date(bins[index].start).toISOString()}: ${formatValue(item, unit)}`
            }
          />
        ))}
      </div>
      <div className="opacity-35 mt-1 flex justify-between text-[0.58rem] uppercase tracking-[0.12em]">
        <span>older</span>
        <span>newer</span>
      </div>
    </article>
  );
}

function CodexMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div
      className="rounded-xl border border-black/10 p-3 dark:border-white/10"
      style={{
        backgroundColor: 'light-dark(rgba(255,255,255,0.4), rgba(0,0,0,0.15))',
      }}
    >
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] opacity-50">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-black tabular-nums">{value}</p>
      <p className="opacity-55 mt-0.5 text-[0.68rem]">{note}</p>
    </div>
  );
}

export function MachineHealthActivity({
  samples,
  now,
  graphicsMaxClockMhz,
  latestActivity,
  latestCodexUsage,
}: {
  samples: MachineHealthSample[];
  now: number;
  graphicsMaxClockMhz: number | null;
  latestActivity: MachineHealthPayload['activity'];
  latestCodexUsage: MachineHealthPayload['codex_usage'];
}) {
  const [range, setRange] = useState<ActivityRange>('24h');
  const bins = useMemo(
    () => buildActivityBins(samples, range, now),
    [samples, range, now]
  );
  const rangeDuration = RANGE_CONFIG[range].bins * RANGE_CONFIG[range].binMs;
  const previousBins = useMemo(
    () => buildActivityBins(samples, range, now - rangeDuration),
    [samples, range, now, rangeDuration]
  );
  const observedBins = bins.filter(bin => bin.sampleCount > 0).length;
  const browserHigh = Math.max(0, ...bins.map(bin => bin.browserRoots ?? 0));
  const workerHigh = Math.max(0, ...bins.map(bin => bin.codexWorkers ?? 0));
  const taggedProcessHigh = Math.max(
    0,
    ...bins.map(bin => bin.routeTaggedProcesses ?? 0)
  );
  const fallbackCount = bins.reduce(
    (total, bin) => total + bin.fallbackCount,
    0
  );
  const undercoveredCount = bins.reduce(
    (total, bin) => total + bin.undercoveredCount,
    0
  );
  const rebootCount = bins.reduce((total, bin) => total + bin.rebootCount, 0);
  const pressureSummary = [
    latestActivity.cpu_pressure_some_percent,
    latestActivity.memory_pressure_full_percent,
    latestActivity.io_pressure_full_percent,
  ]
    .map(value => (value === null ? '—' : `${value.toFixed(2)}%`))
    .join(' / ');

  return (
    <section className="rounded-2xl border border-black/10 bg-[#e4ded2]/75 p-4 dark:border-white/10 dark:bg-[#17191f]/80 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <h2 className="text-lg font-black">Activity</h2>
        <div
          className="bg-white/45 inline-flex self-start rounded-full border border-black/10 p-0.5 dark:border-white/10 dark:bg-black/20"
          aria-label="Activity history range"
        >
          {(['24h', '7d', '30d'] as const).map(option => (
            <button
              key={option}
              type="button"
              aria-pressed={range === option}
              onClick={() => setRange(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
                range === option
                  ? 'bg-[#a53b34] text-white shadow-sm'
                  : 'opacity-55 hover:opacity-90'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ObservationChart
          label="CPU average"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.cpuUsedPercent}
          ceiling={100}
          unit="%"
        />
        <ObservationChart
          label="Memory average"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.memoryUsedPercent}
          ceiling={100}
          unit="%"
        />
        <ObservationChart
          label="Network average"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.networkMibS}
          unit="MiB/s"
        />
        <ObservationChart
          label="Disk I/O average"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.diskMibS}
          unit="MiB/s"
        />
        <ObservationChart
          label="Contention high"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.pressurePercent}
          unit="%"
          summary="maximum"
        />
        <ObservationChart
          label="iGPU clock"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.graphicsClockMhz}
          ceiling={graphicsMaxClockMhz ?? undefined}
          unit="MHz"
        />
        <ObservationChart
          label="Browser RSS high"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.browserRssMib}
          unit="MiB"
          summary="maximum"
        />
        <ObservationChart
          label="Agent processes high"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.routeTaggedProcesses}
          unit="processes"
          summary="maximum"
        />
      </div>

      <CodexActivity
        bins={bins}
        previousBins={previousBins}
        usage={latestCodexUsage}
      />

      <div className="opacity-55 mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-black/10 pt-3 text-xs dark:border-white/10">
        <span>
          Latest:{' '}
          {latestActivity.source === 'sysstat-10m'
            ? `${latestActivity.sample_count}×10m · ${latestActivity.window_minutes}m window`
            : 'point-sample fallback'}
        </span>
        <span>PSI CPU / memory / I/O: {pressureSummary}</span>
        <span>
          Coverage: {fallbackCount} fallback · {undercoveredCount} partial ·{' '}
          {rebootCount} reboot{rebootCount === 1 ? '' : 's'}
        </span>
        <span>
          {observedBins}/{bins.length} {RANGE_CONFIG[range].description} bins
          observed
        </span>
        <span>Browser-root high {browserHigh}</span>
        <span>Codex-worker high {workerHigh}</span>
        <span>Tagged-process high {taggedProcessHigh}</span>
        <span>Empty bins stay visible</span>
      </div>
    </section>
  );
}

function CodexActivity({
  bins,
  previousBins,
  usage,
}: {
  bins: ActivityBin[];
  previousBins: ActivityBin[];
  usage: MachineHealthPayload['codex_usage'];
}) {
  if (!usage || usage.source !== 'session-jsonl')
    return (
      <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
        <p className="text-sm font-black">Codex</p>
        <p className="opacity-55 mt-1 text-xs">
          Aggregate token counters are unavailable in this snapshot.
        </p>
      </div>
    );

  const cacheShare =
    usage.input_tokens === 0
      ? null
      : (usage.cached_input_tokens / usage.input_tokens) * 100;

  return (
    <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
        <h3 className="text-base font-black">Codex</h3>
        <p className="text-[0.68rem] opacity-50">Previous complete UTC hour</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <CodexMetric
          label="Input"
          value={formatValue(usage.input_tokens, 'tokens')}
          note="cached portion included"
        />
        <CodexMetric
          label="Cached input"
          value={cacheShare === null ? '—' : `${cacheShare.toFixed(1)}%`}
          note={`${formatValue(usage.cached_input_tokens, 'tokens')} of input`}
        />
        <CodexMetric
          label="Output"
          value={formatValue(usage.output_tokens, 'tokens')}
          note={`${formatValue(usage.reasoning_output_tokens, 'tokens')} reasoning subset`}
        />
        <CodexMetric
          label="Model calls"
          value={usage.model_calls.toLocaleString('en-US')}
          note={`${usage.active_routes} active route${usage.active_routes === 1 ? '' : 's'}`}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ObservationChart
          label="Input tokens"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.codexInputTokens}
          unit="tokens"
          summary="sum"
        />
        <ObservationChart
          label="Output tokens"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.codexOutputTokens}
          unit="tokens"
          summary="sum"
        />
      </div>
    </div>
  );
}
