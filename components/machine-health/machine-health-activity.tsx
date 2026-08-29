'use client';

import type {
  CodexTokenSample,
  CodexTokenSource,
  MachineHealthPayload,
  MachineHealthSample,
} from '@/app/lib/machine-health-store';
import { useMemo, useState } from 'react';

export type ActivityRange = '10h' | '24h' | '7d' | '30d';

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
  codexCacheWriteInputTokens: number | null;
  codexOutputTokens: number | null;
  codexReasoningOutputTokens: number | null;
  codexTotalTokens: number | null;
  codexModelCalls: number | null;
  codexActiveRoutes: number | null;
  codexWindowCount: number;
  codexSkippedCount: number;
  codexSources: CodexTokenSource[];
  fallbackCount: number;
  undercoveredCount: number;
  rebootCount: number;
  browserRoots: number | null;
  browserRssMib: number | null;
  buildStateGib: number | null;
  codexStateMib: number | null;
  codexWorkers: number | null;
  routeTaggedProcesses: number | null;
  routeTaggedMemoryMib: number | null;
};

const MIB = 1_024 ** 2;
const HOUR_MS = 60 * 60_000;

const RANGE_CONFIG: Record<
  ActivityRange,
  { bins: number; binMs: number; description: string }
> = {
  '10h': { bins: 10, binMs: HOUR_MS, description: 'hourly' },
  '24h': { bins: 24, binMs: HOUR_MS, description: 'hourly' },
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
      codexCacheWriteInputTokens: sum(
        codexValues('codexCacheWriteInputTokens')
      ),
      codexOutputTokens: sum(codexValues('codexOutputTokens')),
      codexReasoningOutputTokens: sum(
        codexValues('codexReasoningOutputTokens')
      ),
      codexTotalTokens: sum(codexValues('codexTotalTokens')),
      codexModelCalls: sum(codexValues('codexModelCalls')),
      codexActiveRoutes:
        activeRoutes.length === 0 ? null : Math.max(...activeRoutes),
      codexWindowCount: includedCodex.length,
      codexSkippedCount: 0,
      codexSources: includedCodex.length === 0 ? [] : ['big-red'],
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
      buildStateGib:
        included.length === 0 ||
        !included.some(sample => sample.buildStateGib !== null)
          ? null
          : Math.max(...included.map(sample => sample.buildStateGib ?? 0)),
      codexStateMib:
        included.length === 0 ||
        !included.some(sample => sample.codexStateAllocatedBytes !== null)
          ? null
          : Math.max(
              ...included.map(
                sample => (sample.codexStateAllocatedBytes ?? 0) / MIB
              )
            ),
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
      routeTaggedMemoryMib:
        included.length === 0
          ? null
          : included.some(sample => sample.routeTaggedMemoryBytes !== null)
            ? Math.max(
                ...included.map(
                  sample => (sample.routeTaggedMemoryBytes ?? 0) / MIB
                )
              )
            : null,
    };
  });
}

export function buildCodexActivityBins(
  samples: CodexTokenSample[],
  range: ActivityRange,
  now: number
) {
  const completeHourEnd = Math.floor(now / HOUR_MS) * HOUR_MS;
  const emptyBins = buildActivityBins([], range, completeHourEnd);
  return emptyBins.map(bin => {
    const included = samples.filter(sample => {
      const windowStartedAt = Date.parse(sample.windowStartedAt);
      return windowStartedAt >= bin.start && windowStartedAt < bin.end;
    });
    const counted = included.filter(
      sample => sample.accountingState === 'counted'
    );
    const activeRoutesByHour = new Map<string, number>();
    for (const sample of counted)
      activeRoutesByHour.set(
        sample.windowStartedAt,
        (activeRoutesByHour.get(sample.windowStartedAt) ?? 0) +
          sample.activeRoutes
      );
    const activeRoutes = [...activeRoutesByHour.values()];
    return {
      ...bin,
      codexInputTokens: sum(counted.map(sample => sample.inputTokens)),
      codexCachedInputTokens: sum(
        counted.map(sample => sample.cachedInputTokens)
      ),
      codexCacheWriteInputTokens: sum(
        counted.map(sample => sample.cacheWriteInputTokens)
      ),
      codexOutputTokens: sum(counted.map(sample => sample.outputTokens)),
      codexReasoningOutputTokens: sum(
        counted.map(sample => sample.reasoningOutputTokens)
      ),
      codexTotalTokens: sum(counted.map(sample => sample.totalTokens)),
      codexModelCalls: sum(counted.map(sample => sample.modelCalls)),
      codexActiveRoutes:
        activeRoutes.length === 0 ? null : Math.max(...activeRoutes),
      codexWindowCount: counted.length,
      codexSkippedCount: included.length - counted.length,
      codexSources: [...new Set(counted.map(sample => sample.source))],
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
  codexSamples,
  now,
  graphicsMaxClockMhz,
  latestActivity,
}: {
  samples: MachineHealthSample[];
  codexSamples: CodexTokenSample[];
  now: number;
  graphicsMaxClockMhz: number | null;
  latestActivity: MachineHealthPayload['activity'];
}) {
  const [range, setRange] = useState<ActivityRange>('10h');
  const bins = useMemo(
    () => buildActivityBins(samples, range, now),
    [samples, range, now]
  );
  const rangeDuration = RANGE_CONFIG[range].bins * RANGE_CONFIG[range].binMs;
  const previousBins = useMemo(
    () => buildActivityBins(samples, range, now - rangeDuration),
    [samples, range, now, rangeDuration]
  );
  const codexBins = useMemo(
    () => buildCodexActivityBins(codexSamples, range, now),
    [codexSamples, range, now]
  );
  const previousCodexBins = useMemo(
    () => buildCodexActivityBins(codexSamples, range, now - rangeDuration),
    [codexSamples, range, now, rangeDuration]
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
          className="bg-white/45 grid w-full grid-cols-4 rounded-full border border-black/10 p-0.5 dark:border-white/10 dark:bg-black/20 sm:inline-flex sm:w-auto sm:self-start"
          aria-label="Activity history range"
        >
          {(['10h', '24h', '7d', '30d'] as const).map(option => (
            <button
              key={option}
              type="button"
              aria-pressed={range === option}
              onClick={() => setRange(option)}
              className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-black transition-colors sm:min-h-0 sm:py-1.5 ${
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
          label="Build state high"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.buildStateGib}
          unit="GiB"
          summary="maximum"
        />
        <ObservationChart
          label="Codex state high"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.codexStateMib}
          unit="MiB"
          summary="maximum"
        />
        <ObservationChart
          label="Agent memory high"
          bins={bins}
          previousBins={previousBins}
          value={bin => bin.routeTaggedMemoryMib}
          unit="MiB"
          summary="maximum"
        />
      </div>

      <CodexActivity
        bins={codexBins}
        previousBins={previousCodexBins}
        range={range}
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
  range,
}: {
  bins: ActivityBin[];
  previousBins: ActivityBin[];
  range: ActivityRange;
}) {
  const observedBins = bins.filter(bin => bin.codexWindowCount > 0).length;
  const skippedWindows = bins.reduce(
    (total, bin) => total + bin.codexSkippedCount,
    0
  );
  if (observedBins === 0 && skippedWindows === 0)
    return (
      <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
        <p className="text-sm font-black">Codex</p>
        <p className="opacity-55 mt-1 text-xs">
          No hourly token records in this window.
        </p>
      </div>
    );

  const totalInput = sum(
    bins
      .map(bin => bin.codexInputTokens)
      .filter((value): value is number => value !== null)
  );
  const totalCachedInput = sum(
    bins
      .map(bin => bin.codexCachedInputTokens)
      .filter((value): value is number => value !== null)
  );
  const totalCacheWriteInput = sum(
    bins
      .map(bin => bin.codexCacheWriteInputTokens)
      .filter((value): value is number => value !== null)
  );
  const totalOutput = sum(
    bins
      .map(bin => bin.codexOutputTokens)
      .filter((value): value is number => value !== null)
  );
  const totalReasoningOutput = sum(
    bins
      .map(bin => bin.codexReasoningOutputTokens)
      .filter((value): value is number => value !== null)
  );
  const totalModelCalls = sum(
    bins
      .map(bin => bin.codexModelCalls)
      .filter((value): value is number => value !== null)
  );
  const activeRoutes = bins
    .map(bin => bin.codexActiveRoutes)
    .filter((value): value is number => value !== null);
  const totalTokens = sum(
    bins
      .map(bin => bin.codexTotalTokens)
      .filter((value): value is number => value !== null)
  );
  const cacheShare =
    totalInput === null || totalInput === 0 || totalCachedInput === null
      ? null
      : (totalCachedInput / totalInput) * 100;
  const rangeLabel =
    range === '10h' ? '10 complete hours' : `${range} selected`;
  const sourceLabels: Record<CodexTokenSource, string> = {
    'big-red': 'Big Red',
    'macbook-air': 'MacBook Air',
  };
  const sourceCoverage = (['big-red', 'macbook-air'] as const)
    .map(source => ({
      source,
      bins: bins.filter(bin => bin.codexSources.includes(source)).length,
    }))
    .filter(item => item.bins > 0)
    .map(
      item =>
        `${sourceLabels[item.source]} ${item.bins}${range === '10h' || range === '24h' ? 'h' : 'd'}`
    )
    .join(' · ');

  return (
    <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
        <h3 className="text-base font-black">Codex</h3>
        <p className="text-[0.68rem] opacity-50">
          {rangeLabel} · {observedBins} recorded
          {sourceCoverage ? ` · ${sourceCoverage}` : ''}
          {skippedWindows > 0 ? ` · ${skippedWindows} source-hour skipped` : ''}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <CodexMetric
          label="Total"
          value={formatValue(totalTokens, 'tokens')}
          note={
            totalTokens === null
              ? '—'
              : `${totalTokens.toLocaleString('en-US')} tokens`
          }
        />
        <CodexMetric
          label="Input"
          value={formatValue(totalInput, 'tokens')}
          note="cached portion included"
        />
        <CodexMetric
          label="Cached input"
          value={cacheShare === null ? '—' : `${cacheShare.toFixed(1)}%`}
          note={`${formatValue(totalCachedInput, 'tokens')} / ${formatValue(totalInput, 'tokens')}`}
        />
        <CodexMetric
          label="Cache writes"
          value={formatValue(totalCacheWriteInput, 'tokens')}
          note="input tokens"
        />
        <CodexMetric
          label="Output"
          value={formatValue(totalOutput, 'tokens')}
          note={`${formatValue(totalReasoningOutput, 'tokens')} reasoning subset`}
        />
        <CodexMetric
          label="Model calls"
          value={totalModelCalls?.toLocaleString('en-US') ?? '—'}
          note={`${activeRoutes.length === 0 ? '—' : Math.max(...activeRoutes)} route high`}
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
