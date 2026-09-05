'use client';

import type {
  CodexTokenSample,
  CodexTokenSource,
  MachineHealthHost,
  WindowsVm,
} from '@/app/lib/machine-health-store';
import {
  ArrowDownRight,
  ArrowUpRight,
  Cpu,
  Gauge,
  HardDrive,
  Laptop,
  MemoryStick,
  Network,
  Server,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { useMachineDevice } from './machine-device-context';
import { ModelUsage } from './model-usage';
import { MachineSourceControl, type MachineScope } from './machine-source-control';

type ActivityRange = '12h' | '24h' | '7d' | '30d';

const HOUR_MS = 60 * 60_000;
const RANGE_CONFIG: Record<
  ActivityRange,
  { bins: number; binMs: number; label: string; averageLabel: string }
> = {
  '12h': {
    bins: 12,
    binMs: HOUR_MS,
    label: '12h',
    averageLabel: '12-hour average',
  },
  '24h': {
    bins: 24,
    binMs: HOUR_MS,
    label: 'Day',
    averageLabel: 'Daily average',
  },
  '7d': {
    bins: 7,
    binMs: 24 * HOUR_MS,
    label: 'Week',
    averageLabel: 'Daily average',
  },
  '30d': {
    bins: 30,
    binMs: 24 * HOUR_MS,
    label: 'Month',
    averageLabel: 'Daily average',
  },
};

type ResourceKey = 'cpu' | 'memory' | 'storage';


export type PublicMachineHealthSample = {
  windowsVm?: WindowsVm | null;
  memoryTotalGib?: number | null;
  memoryComparable?: boolean;
  host: MachineHealthHost;
  checkedAt: string;
  cpuUsedPercent: number;
  memoryUsedPercent: number;
  rootUsedPercent: number;
  networkRxMibS: number;
  networkTxMibS: number;
  diskReadMibS: number | null;
  diskWriteMibS: number | null;
  pressurePercent: number | null;
  coreAveragePercent: number[] | null;
  corePeakPercent: number[] | null;
  networkPeakMibS: number | null;
  diskPeakMibS: number | null;
};

type PublicActivityBin = {
  memoryUsedGib: number | null;
  memoryLegacyCount: number;
  start: number;
  end: number;
  cpuUsedPercent: number | null;
  memoryUsedPercent: number | null;
  rootUsedPercent: number | null;
  networkMibS: number | null;
  diskMibS: number | null;
  pressurePercent: number | null;
  coreAveragePercent: number[] | null;
  corePeakPercent: number[] | null;
  networkPeakMibS: number | null;
  diskPeakMibS: number | null;
};

type CodexActivityBin = {
  start: number;
  end: number;
  codexInputTokens: number | null;
  codexCachedInputTokens: number | null;
  codexCacheWriteInputTokens: number | null;
  codexOutputTokens: number | null;
  codexReasoningOutputTokens: number | null;
  codexTotalTokens: number | null;
  codexModelCalls: number | null;
  codexHourCount: number;
  codexSourceInputTokens: Record<CodexTokenSource, number>;
};

export type MachineResourceSnapshot = {
  checkedAt?: string;
  logicalCpus?: number;
  memoryTotalGib?: number;
  memoryComparable?: boolean;
  memoryUsedGib?: number;
  swapUsedGib?: number;
  swapTotalGib?: number;
  storageTotalGib?: number;
  activitySource?: 'point' | 'sysstat-10m';
  activityWindowMinutes?: number;
  activitySampleCount?: number;
  cpuPercent: number;
  memoryPercent: number;
  storagePercent: number;
  storageFreeGib: number;
};

const RESOURCE_CONFIG: Record<
  ResourceKey,
  {
    label: string;
    color: string;
    selectedColor: string;
    darkColor: string;
    darkSelectedColor: string;
    icon: LucideIcon;
    iconColor: string;
    value: (bin: PublicActivityBin) => number | null;
  }
> = {
  cpu: {
    label: 'CPU',
    color: 'bg-[#b74a42]',
    selectedColor: 'bg-[#7f2d28]',
    darkColor: 'dark:bg-[#e77970]',
    darkSelectedColor: 'dark:bg-[#ffaaa2]',
    icon: Cpu,
    iconColor: 'text-[#9b3b35] dark:text-[#ef8b83]',
    value: bin => bin.cpuUsedPercent,
  },
  memory: {
    label: 'Memory',
    color: 'bg-[#378690]',
    selectedColor: 'bg-[#205b63]',
    darkColor: 'dark:bg-[#66c0c8]',
    darkSelectedColor: 'dark:bg-[#99e1e5]',
    icon: MemoryStick,
    iconColor: 'text-[#2e747d] dark:text-[#79cad1]',
    value: bin => bin.memoryUsedPercent,
  },
  storage: {
    label: 'Storage',
    color: 'bg-[#b98532]',
    selectedColor: 'bg-[#7d581d]',
    darkColor: 'dark:bg-[#e2b660]',
    darkSelectedColor: 'dark:bg-[#ffd58a]',
    icon: HardDrive,
    iconColor: 'text-[#926920] dark:text-[#eac270]',
    value: bin => bin.rootUsedPercent,
  },
};

const subscribeToTimeZone = () => () => undefined;
const getServerTimeZone = () => 'UTC';
const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function average(values: number[]) {
  return values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function nullableSum(values: number[]) {
  return values.length === 0 ? null : sum(values);
}

function averageCoreArrays(values: (number[] | null)[]) {
  const available = values.filter((value): value is number[] => value !== null);
  if (available.length === 0) return null;
  const coreCount = available[0].length;
  const compatible = available.filter(value => value.length === coreCount);
  return Array.from({ length: coreCount }, (_, index) =>
    average(compatible.map(value => value[index]))
  ).filter((value): value is number => value !== null);
}

function peakCoreArrays(values: (number[] | null)[]) {
  const available = values.filter((value): value is number[] => value !== null);
  if (available.length === 0) return null;
  const coreCount = available[0].length;
  const compatible = available.filter(value => value.length === coreCount);
  return Array.from({ length: coreCount }, (_, index) =>
    Math.max(...compatible.map(value => value[index]))
  );
}

export function buildPublicActivityBins(
  samples: PublicMachineHealthSample[],
  range: ActivityRange,
  now: number
): PublicActivityBin[] {
  const { bins, binMs } = RANGE_CONFIG[range];
  const alignedEnd = Math.ceil(now / binMs) * binMs;
  const start = alignedEnd - bins * binMs;
  return Array.from({ length: bins }, (_, index) => {
    const binStart = start + index * binMs;
    const binEnd = binStart + binMs;
    const included = samples.filter(sample => {
      const checkedAt = Date.parse(sample.checkedAt);
      return checkedAt >= binStart && checkedAt < binEnd;
    });
    const diskValues = included
      .filter(
        sample => sample.diskReadMibS !== null || sample.diskWriteMibS !== null
      )
      .map(sample => (sample.diskReadMibS ?? 0) + (sample.diskWriteMibS ?? 0));
    const pressureValues = included
      .map(sample => sample.pressurePercent)
      .filter((value): value is number => value !== null);
    const networkPeaks = included
      .map(sample => sample.networkPeakMibS)
      .filter((value): value is number => value !== null);
    const diskPeaks = included
      .map(sample => sample.diskPeakMibS)
      .filter((value): value is number => value !== null);
    return {
      start: binStart,
      end: binEnd,
      memoryLegacyCount: included.filter(
        sample => sample.memoryComparable === false
      ).length,
      memoryUsedGib: average(
        included
          .filter(sample => sample.memoryComparable !== false)
          .flatMap(sample =>
            sample.memoryTotalGib == null
              ? []
              : [(sample.memoryUsedPercent * sample.memoryTotalGib) / 100]
          )
      ),
      cpuUsedPercent: average(included.map(sample => sample.cpuUsedPercent)),
      memoryUsedPercent: average(
        included
          .filter(sample => sample.memoryComparable !== false)
          .map(sample => sample.memoryUsedPercent)
      ),
      rootUsedPercent: average(included.map(sample => sample.rootUsedPercent)),
      networkMibS: average(
        included.map(sample => sample.networkRxMibS + sample.networkTxMibS)
      ),
      diskMibS: average(diskValues),
      pressurePercent:
        pressureValues.length === 0 ? null : Math.max(...pressureValues),
      coreAveragePercent: averageCoreArrays(
        included.map(sample => sample.coreAveragePercent)
      ),
      corePeakPercent: peakCoreArrays(
        included.map(sample => sample.corePeakPercent)
      ),
      networkPeakMibS:
        networkPeaks.length === 0 ? null : Math.max(...networkPeaks),
      diskPeakMibS: diskPeaks.length === 0 ? null : Math.max(...diskPeaks),
    };
  });
}

function buildCodexBins(
  samples: CodexTokenSample[],
  range: ActivityRange,
  now: number
): CodexActivityBin[] {
  const { bins, binMs } = RANGE_CONFIG[range];
  const completeHourEnd = Math.floor(now / HOUR_MS) * HOUR_MS;
  const start = completeHourEnd - bins * binMs;

  return Array.from({ length: bins }, (_, index) => {
    const binStart = start + index * binMs;
    const binEnd = binStart + binMs;
    const included = samples.filter(sample => {
      const windowStartedAt = Date.parse(sample.windowStartedAt);
      return windowStartedAt >= binStart && windowStartedAt < binEnd;
    });
    const counted = included.filter(
      sample => sample.accountingState === 'counted'
    );
    const values = (field: keyof CodexTokenSample) =>
      counted
        .map(sample => sample[field])
        .filter((value): value is number => typeof value === 'number');
    const sourceInput = (source: CodexTokenSource) =>
      sum(
        counted
          .filter(sample => sample.source === source)
          .map(sample => sample.inputTokens)
      );

    return {
      start: binStart,
      end: binEnd,
      codexInputTokens: nullableSum(values('inputTokens')),
      codexCachedInputTokens: nullableSum(values('cachedInputTokens')),
      codexCacheWriteInputTokens: nullableSum(values('cacheWriteInputTokens')),
      codexOutputTokens: nullableSum(values('outputTokens')),
      codexReasoningOutputTokens: nullableSum(values('reasoningOutputTokens')),
      codexTotalTokens: nullableSum(values('totalTokens')),
      codexModelCalls: nullableSum(values('modelCalls')),
      codexHourCount: new Set(counted.map(sample => sample.windowStartedAt))
        .size,
      codexSourceInputTokens: {
        'big-red': sourceInput('big-red'),
        'macbook-air': sourceInput('macbook-air'),
      },
    };
  });
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function percent(value: number | null) {
  return value === null ? '—' : `${Math.round(value)}%`;
}

function formatThroughput(value: number | null) {
  if (value === null) return '—';
  return `${value.toFixed(value < 10 ? 1 : 0)} MiB/s`;
}

function DeltaValue({ value, suffix }: { value: number; suffix: string }) {
  const RisingIcon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center justify-end gap-1">
      <RisingIcon aria-hidden="true" className="size-3.5 stroke-[1.8]" />
      <span>
        {compactNumber(Math.abs(value))} {suffix}
      </span>
    </span>
  );
}

function formatBin(bin: { start: number; end: number }, timeZone: string) {
  const daily = bin.end - bin.start >= 24 * HOUR_MS;
  return new Intl.DateTimeFormat('en-US', {
    ...(daily
      ? { weekday: 'short', month: 'short', day: 'numeric' }
      : { weekday: 'short', hour: 'numeric' }),
    timeZone,
  }).format(bin.start);
}

function axisLabel(bin: { start: number; end: number }, timeZone: string) {
  const daily = bin.end - bin.start >= 24 * HOUR_MS;
  return new Intl.DateTimeFormat('en-US', {
    ...(daily
      ? { month: 'numeric', day: 'numeric' }
      : { hour: 'numeric', hour12: false }),
    timeZone,
  }).format(bin.start);
}

function RangeControl({
  range,
  onChange,
  label,
}: {
  range: ActivityRange;
  onChange: (range: ActivityRange) => void;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label={`${label} history range`}
    >
      {(
        Object.entries(RANGE_CONFIG) as [
          ActivityRange,
          (typeof RANGE_CONFIG)[ActivityRange],
        ][]
      ).map(([option, config]) => (
        <button
          key={option}
          type="button"
          aria-pressed={range === option}
          onClick={() => onChange(option)}
          className={`min-h-9 border-b px-2 text-[0.7rem] font-medium tabular-nums transition-[border-color,color,opacity] sm:px-2.5 ${
            range === option
              ? 'border-current opacity-95'
              : 'opacity-35 border-transparent hover:opacity-75'
          }`}
        >
          {config.label}
        </button>
      ))}
    </div>
  );
}

function TimelineBars({
  bins,
  values,
  selectedIndex,
  onSelect,
  color,
  selectedColor,
  darkColor,
  darkSelectedColor,
  timeZone,
  label,
  minimumMax = 100,
  formatValue = percent,
}: {
  minimumMax?: number;
  formatValue?: (value: number | null) => string;
  bins: { start: number; end: number }[];
  values: (number | null)[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  color: string;
  selectedColor: string;
  darkColor: string;
  darkSelectedColor: string;
  timeZone: string;
  label: string;
}) {
  const max = Math.max(
    minimumMax,
    ...values.filter((value): value is number => value !== null)
  );
  return (
    <div>
      <div className="border-black/15 dark:border-white/15 relative h-36 border-b">
        {[25, 50, 75, 100].map(value => (
          <span
            key={value}
            aria-hidden="true"
            className="border-black/7 dark:border-white/8 absolute inset-x-0 border-t"
            style={{ bottom: `${value}%` }}
          />
        ))}
        <div
          className="absolute inset-0 flex items-end gap-1 pt-2"
          role="group"
          aria-label={`${label} history`}
        >
          {bins.map((bin, index) => {
            const value = values[index];
            const selected = selectedIndex === index;
            return (
              <button
                key={bin.start}
                type="button"
                disabled={value === null}
                aria-pressed={selected}
                aria-label={`${formatBin(bin, timeZone)}: ${formatValue(value)}`}
                onClick={() => onSelect(index)}
                className="group relative flex h-full min-w-0 flex-1 touch-manipulation items-end outline-none [-webkit-tap-highlight-color:transparent] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[#a53b34]"
              >
                <span
                  aria-hidden="true"
                  className={`w-full min-w-[2px] rounded-t-[2px] transition-[height,background-color,opacity] ${
                    value === null
                      ? 'h-px bg-black/10 dark:bg-white/10'
                      : selected
                        ? `${selectedColor} ${darkSelectedColor}`
                        : `${color} ${darkColor} group-hover:opacity-80`
                  }`}
                  style={
                    value === null
                      ? undefined
                      : { height: `${Math.max(3, (value / max) * 100)}%` }
                  }
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[0.58rem] tabular-nums opacity-40">
        <span>{axisLabel(bins[0], timeZone)}</span>
        <span>{axisLabel(bins[Math.floor(bins.length / 2)], timeZone)}</span>
        <span>{axisLabel(bins.at(-1)!, timeZone)}</span>
      </div>
    </div>
  );
}

function ResourceHistory({
  bins,
  previousBins,
  range,
  current,
  metric,
  onMetricChange,
}: {
  bins: PublicActivityBin[];
  previousBins: PublicActivityBin[];
  range: ActivityRange;
  current: MachineResourceSnapshot;
  metric: ResourceKey;
  onMetricChange: (metric: ResourceKey) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone
  );
  const config = RESOURCE_CONFIG[metric];
  const MetricIcon = config.icon;
  const values = bins.map(config.value);
  const previousValues = previousBins
    .map(config.value)
    .filter((value): value is number => value !== null);
  const rangeAverage = average(
    values.filter((value): value is number => value !== null)
  );
  const previousAverage = average(previousValues);
  const selectedBin = selectedIndex === null ? null : bins[selectedIndex];
  const selectedValue = selectedIndex === null ? null : values[selectedIndex];
  const headline = selectedValue ?? rangeAverage;
  const delta =
    selectedIndex === null && rangeAverage !== null && previousAverage !== null
      ? rangeAverage - previousAverage
      : null;
  const memoryHeadline = selectedBin
    ? selectedBin.memoryUsedGib
    : average(
        bins.flatMap(bin =>
          bin.memoryUsedGib === null ? [] : [bin.memoryUsedGib]
        )
      );
  const currentValues: Record<ResourceKey, number> = {
    cpu: current.cpuPercent,
    memory: current.memoryPercent,
    storage: current.storagePercent,
  };

  return (
    <section
      data-machine-health-resources
      className="bg-white/45 overflow-hidden rounded-2xl border border-black/[0.06] shadow-[0_1px_1px_rgba(0,0,0,0.035)] dark:border-white/[0.07] dark:bg-white/[0.045] dark:shadow-none"
    >
      <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <div className="flex min-h-[4.25rem] items-start justify-between gap-4">
          <div>
            <p className="opacity-55 text-xs font-medium">
              {selectedBin
                ? formatBin(selectedBin, timeZone)
                : `${config.label} · avg`}
            </p>
            <p className="mt-0.5 text-[2.15rem] font-semibold tabular-nums leading-none tracking-[-0.045em]">
              {metric === 'memory' && memoryHeadline !== null
                ? `${memoryHeadline.toFixed(1)} GiB`
                : percent(headline)}
            </p>
          </div>
          <div className="pt-0.5 text-right text-xs">
            <MetricIcon
              aria-label={config.label}
              className={`size-[1.1rem] ml-auto stroke-[1.8] ${config.iconColor}`}
            />
            {delta !== null && Math.abs(delta) >= 0.5 ? (
              <p className="opacity-45 mt-1 tabular-nums">
                <DeltaValue value={delta} suffix="points" />
              </p>
            ) : null}
          </div>
        </div>

        <TimelineBars
          bins={bins}
          values={values}
          selectedIndex={selectedIndex}
          onSelect={index =>
            setSelectedIndex(currentIndex =>
              currentIndex === index ? null : index
            )
          }
          color={config.color}
          selectedColor={config.selectedColor}
          darkColor={config.darkColor}
          darkSelectedColor={config.darkSelectedColor}
          timeZone={timeZone}
          label={config.label}
        />
      </div>

      {metric === 'memory' && bins.some(bin => bin.memoryLegacyCount > 0) ? (
        <p className="px-5 pb-2 text-xs opacity-60">Earlier RAM unavailable</p>
      ) : null}
      <div className="border-black/9 border-t dark:border-white/10">
        {(Object.keys(RESOURCE_CONFIG) as ResourceKey[]).map(key => {
          const item = RESOURCE_CONFIG[key];
          const ItemIcon = item.icon;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={metric === key}
              onClick={() => {
                onMetricChange(key);
                setSelectedIndex(null);
              }}
              className="grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_2.5rem] items-center gap-3 border-b border-black/[0.055] px-5 py-2.5 text-left last:border-b-0 hover:bg-black/[0.025] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#a53b34] dark:border-white/[0.065] dark:hover:bg-white/[0.035] aria-pressed:bg-black/[0.045] dark:aria-pressed:bg-white/[0.06]"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <ItemIcon
                  aria-hidden="true"
                  className={`size-[1.05rem] shrink-0 stroke-[1.8] ${item.iconColor}`}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </span>
              <span className="text-right text-xs tabular-nums">
                {key === 'memory'
                  ? current.memoryComparable === false || current.memoryTotalGib === undefined
                    ? '—'
                    : `${current.memoryUsedGib === undefined ? '≈ ' : ''}${(current.memoryUsedGib ?? (current.memoryTotalGib * current.memoryPercent) / 100).toFixed(1)} / ${current.memoryTotalGib.toFixed(1)} GiB`
                  : key === 'storage'
                    ? `${Math.round(current.storageFreeGib)}${current.storageTotalGib === undefined ? '' : ` / ${current.storageTotalGib.toFixed(1)}`} GiB free`
                    : current.logicalCpus === undefined
                      ? '—'
                      : `${((current.cpuPercent * current.logicalCpus) / 100).toFixed(2)} / ${current.logicalCpus} cores`}
              </span>
              <span className="text-right text-xs tabular-nums opacity-55">
                {key === 'memory' && current.memoryComparable === false
                  ? '—'
                  : key === 'memory' &&
                      current.memoryUsedGib !== undefined &&
                      current.memoryTotalGib
                    ? percent(
                        (current.memoryUsedGib / current.memoryTotalGib) * 100
                      )
                    : percent(currentValues[key])}
              </span>
            </button>
          );
        })}
      </div>
      <p className="flex justify-between gap-3 border-t border-black/10 px-5 py-2.5 text-xs tabular-nums dark:border-white/10">
        <span className="opacity-60">Swap</span><span>
        {current.swapUsedGib === undefined || current.swapTotalGib === undefined
          ? 'unavailable'
          : `${current.swapUsedGib.toFixed(2)} / ${current.swapTotalGib.toFixed(1)} GiB`}
        </span>
      </p>
    </section>
  );
}

function sourceTotals(bins: CodexActivityBin[]) {
  return (['big-red', 'macbook-air'] as const).map(source => ({
    source,
    value: sum(bins.map(bin => bin.codexSourceInputTokens[source])),
  }));
}

function CodexHistory({
  bins,
  previousBins,
}: {
  bins: CodexActivityBin[];
  previousBins: CodexActivityBin[];
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone
  );
  const inputs = bins.map(bin => bin.codexInputTokens);
  const totalInput = sum(inputs.map(value => value ?? 0));
  const totalOutput = sum(bins.map(bin => bin.codexOutputTokens ?? 0));
  const totalTokens = sum(bins.map(bin => bin.codexTotalTokens ?? 0));
  const cachedInput = sum(bins.map(bin => bin.codexCachedInputTokens ?? 0));
  const cacheWrites = sum(bins.map(bin => bin.codexCacheWriteInputTokens ?? 0));
  const modelCalls = sum(bins.map(bin => bin.codexModelCalls ?? 0));
  const reasoning = sum(bins.map(bin => bin.codexReasoningOutputTokens ?? 0));
  const previousInput = sum(previousBins.map(bin => bin.codexInputTokens ?? 0));
  const observedHours = sum(bins.map(bin => bin.codexHourCount));
  const selectedBin = selectedIndex === null ? null : bins[selectedIndex];
  const selectedInput =
    selectedIndex === null ? null : bins[selectedIndex].codexInputTokens;
  const max = Math.max(...inputs.map(value => value ?? 0), 1);
  const sources = sourceTotals(bins);
  const sourceLabels: Record<CodexTokenSource, string> = {
    'big-red': 'Big Red',
    'macbook-air': 'Air Blue',
  };
  const cacheShare = totalInput > 0 ? (cachedInput / totalInput) * 100 : 0;

  if (observedHours === 0) return null;

  return (
    <section
      data-machine-health-codex
      className="bg-white/45 overflow-hidden rounded-2xl border border-black/[0.06] shadow-[0_1px_1px_rgba(0,0,0,0.035)] dark:border-white/[0.07] dark:bg-white/[0.045] dark:shadow-none"
    >
      <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <div className="flex min-h-[4.25rem] items-start justify-between gap-4">
          <div>
            <p className="opacity-55 text-xs font-medium">
              {selectedBin ? formatBin(selectedBin, timeZone) : 'Input tokens'}
            </p>
            <p className="mt-0.5 text-[2.15rem] font-semibold tabular-nums leading-none tracking-[-0.045em]">
              {compactNumber(selectedInput ?? totalInput)}
            </p>
          </div>
          <div className="pt-0.5 text-right text-xs">
            <SquareTerminal
              aria-label="Codex"
              className="size-[1.1rem] opacity-65 ml-auto stroke-[1.8]"
            />
            {selectedIndex === null && previousInput > 0 ? (
              <p className="opacity-45 mt-1 tabular-nums">
                <DeltaValue
                  value={totalInput - previousInput}
                  suffix="vs prior"
                />
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-black/15 dark:border-white/15 relative h-36 border-b">
          {[0.25, 0.5, 0.75, 1].map(value => (
            <span
              key={value}
              aria-hidden="true"
              className="border-black/7 dark:border-white/8 absolute inset-x-0 border-t"
              style={{ bottom: `${value * 100}%` }}
            />
          ))}
          <div
            className="absolute inset-0 flex items-end gap-1 pt-2"
            role="group"
            aria-label="Codex input token history"
          >
            {bins.map((bin, index) => {
              const input = bin.codexInputTokens;
              const selected = selectedIndex === index;
              return (
                <button
                  key={bin.start}
                  type="button"
                  disabled={input === null || input === 0}
                  aria-pressed={selected}
                  aria-label={`${formatBin(bin, timeZone)}: ${compactNumber(input ?? 0)} input tokens`}
                  onClick={() =>
                    setSelectedIndex(current =>
                      current === index ? null : index
                    )
                  }
                  className="group flex h-full min-w-0 flex-1 touch-manipulation items-end outline-none [-webkit-tap-highlight-color:transparent] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[#a53b34]"
                >
                  <span
                    aria-hidden="true"
                    className={`flex w-full flex-col-reverse overflow-hidden rounded-t-[2px] ${selected ? 'brightness-75 dark:brightness-125' : 'group-hover:brightness-90 dark:group-hover:brightness-110'}`}
                    style={
                      input === null || input === 0
                        ? { height: '1px' }
                        : { height: `${Math.max(3, (input / max) * 100)}%` }
                    }
                  >
                    {input === null || input === 0 ? (
                      <span className="h-px bg-black/10 dark:bg-white/10" />
                    ) : (
                      <>
                        <span
                          className="bg-[#b74a42] dark:bg-[#e77970]"
                          style={{
                            height: `${(bin.codexSourceInputTokens['big-red'] / input) * 100}%`,
                          }}
                        />
                        <span
                          className="bg-[#378690] dark:bg-[#66c0c8]"
                          style={{
                            height: `${(bin.codexSourceInputTokens['macbook-air'] / input) * 100}%`,
                          }}
                        />
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[0.58rem] tabular-nums opacity-40">
          <span>{axisLabel(bins[0], timeZone)}</span>
          <span>{axisLabel(bins[Math.floor(bins.length / 2)], timeZone)}</span>
          <span>{axisLabel(bins.at(-1)!, timeZone)}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-5 px-0.5 text-xs">
          {sources.map(({ source, value }) => (
            <div
              key={source}
              className="flex items-center justify-between gap-2"
            >
              <span className="opacity-65 flex items-center gap-2">
                {source === 'big-red' ? (
                  <Server
                    aria-hidden="true"
                    className="size-3.5 stroke-[1.8] text-[#9b3b35] dark:text-[#ef8b83]"
                  />
                ) : (
                  <Laptop
                    aria-hidden="true"
                    className="size-3.5 stroke-[1.8] text-[#2e747d] dark:text-[#79cad1]"
                  />
                )}
                {sourceLabels[source]}
              </span>
              <span className="font-medium tabular-nums">
                {compactNumber(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <dl className="border-t border-black/[0.065] dark:border-white/[0.075]">
        <div className="min-h-11 grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 border-b border-black/[0.055] px-5 py-2.5 dark:border-white/[0.065]">
          <dt className="text-[0.95rem] leading-tight">Cached input</dt>
          <dd className="text-right font-medium tabular-nums leading-none">
            {cacheShare.toFixed(1)}%
          </dd>
        </div>
        {cacheWrites > 0 ? (
          <div className="min-h-11 grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 border-b border-black/[0.055] px-5 py-2.5 dark:border-white/[0.065]">
            <dt className="text-[0.95rem] leading-tight">Cache writes</dt>
            <dd className="text-right font-medium tabular-nums leading-none">
              {compactNumber(cacheWrites)}
            </dd>
          </div>
        ) : null}
        <div className="min-h-11 grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 border-b border-black/[0.055] px-5 py-2.5 dark:border-white/[0.065]">
          <dt>
            <span className="block text-sm leading-tight">Output / reasoning</span>
          </dt>
          <dd className="text-right font-medium tabular-nums leading-none">
            <span className="text-xs">{compactNumber(totalOutput)} / {compactNumber(reasoning)}</span>
          </dd>
        </div>
        <div className="min-h-11 grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 border-b border-black/[0.055] px-5 py-2.5 dark:border-white/[0.065]">
          <dt className="text-[0.95rem] leading-tight">Model calls</dt>
          <dd className="text-right font-medium tabular-nums leading-none">
            {modelCalls.toLocaleString('en-US')}
          </dd>
        </div>
        <div className="grid min-h-[3.8rem] grid-cols-[minmax(0,1fr)_minmax(7.5rem,auto)] items-center gap-3 px-5 py-3">
          <dt>
            <span className="block text-[0.95rem] font-semibold leading-tight">
              Total tokens
            </span>
          </dt>
          <dd className="text-right text-[1.05rem] font-semibold tabular-nums tracking-[-0.02em]">
            {totalTokens.toLocaleString('en-US')}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function CoreActivity({ bins }: { bins: PublicActivityBin[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone
  );
  const availableIndexes = bins.flatMap((bin, index) =>
    bin.coreAveragePercent ? [index] : []
  );
  if (availableIndexes.length === 0) return null;

  const activeIndex =
    selectedIndex !== null && bins[selectedIndex]?.coreAveragePercent
      ? selectedIndex
      : availableIndexes.at(-1)!;
  const activeBin = bins[activeIndex];
  const activeAverages = activeBin.coreAveragePercent!;
  const activePeaks = activeBin.corePeakPercent;
  const busiestCore = activeAverages.reduce(
    (best, value, index) => (value > activeAverages[best] ? index : best),
    0
  );

  return (
    <section className="border-black/7 dark:border-white/8 border-t py-3">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Cpu
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 stroke-[1.8] text-[#9b3b35] dark:text-[#ef8b83]"
          />
          <div>
            <h4 className="text-sm font-medium">Core activity</h4>
            <p className="opacity-45 mt-0.5 text-xs">
              {formatBin(activeBin, timeZone)}
            </p>
          </div>
        </div>
        <p className="text-right text-xs tabular-nums">
          <span className="block font-medium">Core {busiestCore}</span>
          <span className="opacity-45 mt-0.5 block">
            {percent(activeAverages[busiestCore])} avg
            {activePeaks ? ` · ${percent(activePeaks[busiestCore])} high` : ''}
          </span>
        </p>
      </div>

      <div
        className="flex h-28 items-stretch gap-px"
        role="group"
        aria-label="Per-core CPU history"
      >
        {bins.map((bin, index) => {
          const averages = bin.coreAveragePercent;
          if (!averages)
            return (
              <span
                key={bin.start}
                aria-hidden="true"
                className="min-w-0 flex-1 rounded-[2px] bg-black/[0.025] dark:bg-white/[0.025]"
              />
            );
          const selected = index === activeIndex;
          const busiest = averages.reduce(
            (best, value, core) => (value > averages[best] ? core : best),
            0
          );
          return (
            <button
              key={bin.start}
              type="button"
              aria-pressed={selected}
              aria-label={`${formatBin(bin, timeZone)}: core ${busiest} busiest at ${percent(averages[busiest])}`}
              onClick={() => setSelectedIndex(index)}
              className={`flex min-w-0 flex-1 flex-col gap-px rounded-[2px] p-px outline-none [-webkit-tap-highlight-color:transparent] enabled:hover:bg-black/[0.045] enabled:focus-visible:ring-2 enabled:focus-visible:ring-[#a53b34] dark:enabled:hover:bg-white/[0.055] ${
                selected
                  ? 'bg-black/[0.07] ring-1 ring-black/15 dark:bg-white/[0.09] dark:ring-white/20'
                  : ''
              }`}
            >
              {averages.map((value, core) => (
                <span
                  key={core}
                  aria-hidden="true"
                  className="min-h-px flex-1 w-full rounded-[1px] bg-[#b74a42] dark:bg-[#e77970]"
                  style={{ opacity: Math.max(0.12, value / 100) }}
                />
              ))}
            </button>
          );
        })}
      </div>
      <div className="opacity-35 mt-1 flex justify-between font-mono text-[0.58rem] tabular-nums">
        <span>{axisLabel(bins[0], timeZone)}</span>
        <span>Cores 0–{activeAverages.length - 1}</span>
        <span>{axisLabel(bins.at(-1)!, timeZone)}</span>
      </div>
    </section>
  );
}

function PerformanceDetails({ bins }: { bins: PublicActivityBin[] }) {
  const network = average(
    bins
      .map(bin => bin.networkMibS)
      .filter((value): value is number => value !== null)
  );
  const disk = average(
    bins
      .map(bin => bin.diskMibS)
      .filter((value): value is number => value !== null)
  );
  const pressureValues = bins
    .map(bin => bin.pressurePercent)
    .filter((value): value is number => value !== null);
  const pressure = pressureValues.length ? Math.max(...pressureValues) : null;
  const networkPeakValues = bins
    .map(bin => bin.networkPeakMibS)
    .filter((value): value is number => value !== null);
  const diskPeakValues = bins
    .map(bin => bin.diskPeakMibS)
    .filter((value): value is number => value !== null);
  const networkPeak = networkPeakValues.length
    ? Math.max(...networkPeakValues)
    : null;
  const diskPeak = diskPeakValues.length ? Math.max(...diskPeakValues) : null;

  return (
    <details className="border-t border-black/10 py-1 dark:border-white/10">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium opacity-60 hover:opacity-100">
        Performance details
      </summary>
      <dl className="pb-2 text-sm">
        <div className="border-black/7 dark:border-white/8 flex items-center justify-between gap-4 border-t py-3">
          <dt className="opacity-60 flex items-center gap-2">
            <Network aria-hidden="true" className="size-4 stroke-[1.7]" />
            Network
          </dt>
          <dd className="text-right tabular-nums">
            <span className="block font-medium">
              {formatThroughput(network)}
            </span>
            {networkPeak !== null ? (
              <span className="opacity-45 mt-0.5 block text-xs">
                {formatThroughput(networkPeak)} high
              </span>
            ) : null}
          </dd>
        </div>
        <div className="border-black/7 dark:border-white/8 flex items-center justify-between gap-4 border-t py-3">
          <dt className="opacity-60 flex items-center gap-2">
            <HardDrive aria-hidden="true" className="size-4 stroke-[1.7]" />
            Disk I/O
          </dt>
          <dd className="text-right tabular-nums">
            <span className="block font-medium">{formatThroughput(disk)}</span>
            {diskPeak !== null ? (
              <span className="opacity-45 mt-0.5 block text-xs">
                {formatThroughput(diskPeak)} high
              </span>
            ) : null}
          </dd>
        </div>
        <div className="border-black/7 dark:border-white/8 flex items-center justify-between gap-4 border-t py-3">
          <dt className="opacity-60 flex items-center gap-2">
            <Gauge aria-hidden="true" className="size-4 stroke-[1.7]" />
            Peak contention
          </dt>
          <dd className="font-medium tabular-nums">{percent(pressure)}</dd>
        </div>
      </dl>
      <CoreActivity bins={bins} />
    </details>
  );
}

export function buildWindowsVmBins(
  samples: Pick<
    PublicMachineHealthSample,
    'host' | 'checkedAt' | 'windowsVm'
  >[],
  range: ActivityRange,
  now: number
) {
  const { bins, binMs } = RANGE_CONFIG[range];
  const end = Math.ceil(now / binMs) * binMs;
  return Array.from({ length: bins }, (_, index) => {
    const start = end - (bins - index) * binMs;
    const observed = samples
      .filter(
        sample =>
          sample.host === 'big-red' &&
          Date.parse(sample.checkedAt) >= start &&
          Date.parse(sample.checkedAt) < start + binMs
      )
      .flatMap(sample =>
        sample.windowsVm?.source === 'libvirt' ? [sample.windowsVm] : []
      );
    const measured = (values: (number | null)[]) =>
      values.filter((value): value is number => value !== null);
    const memory = measured(observed.map(vm => vm.resident_gib));
    return {
      start,
      end: start + binMs,
      cpu: average(measured(observed.map(vm => vm.cpu_cores))),
      memory: memory.length ? Math.max(...memory) : null,
      running: observed.length
        ? (observed.filter(vm => vm.state === 'running').length /
            observed.length) *
          100
        : null,
      observations: observed.length,
    };
  });
}

function WindowsVmHistory({
  samples,
  current,
  now,
}: {
  samples: PublicMachineHealthSample[];
  current?: WindowsVm;
  now: number;
}) {
  const [range, setRange] = useState<ActivityRange>('12h');
  const [metric, setMetric] = useState<'memory' | 'cpu' | 'running'>('memory');
  const [selected, setSelected] = useState<number | null>(null);
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone
  );
  const bins = buildWindowsVmBins(samples, range, now);
  const vm = current?.source === 'libvirt' ? current : null;
  const format = (value: number | null) =>
    value === null
      ? 'Unavailable'
      : metric === 'memory'
        ? `${value.toFixed(2)} GiB`
        : metric === 'cpu'
          ? `${value.toFixed(2)} cores`
          : `${Math.round(value)}% of observations`;
  const selectedBin = selected === null ? null : bins[selected];
  const currentValue = vm
    ? metric === 'memory'
      ? vm.resident_gib
      : metric === 'cpu'
        ? vm.cpu_cores
        : vm.state === 'running'
          ? 100
          : 0
    : null;
  return (
    <section
      aria-label="Windows VM"
      className="mt-6 border-t border-black/10 pt-5 dark:border-white/10"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            Windows VM{' '}
            <span className="text-sm font-normal opacity-60">
              · {vm?.state ?? 'telemetry unavailable'}
            </span>
          </h3>
          <p className="mt-1 text-xs opacity-60">
            {vm?.allocated_gib == null
              ? 'RAM allocation unavailable'
              : `${vm.allocated_gib.toFixed(1)} GiB allocated`}
            {' · '}
            {vm?.vcpus == null ? 'vCPU count unavailable' : `${vm.vcpus} vCPUs`}
          </p>
        </div>
        <div className="flex gap-3" aria-label="Windows VM metric">
          {(['memory', 'cpu', 'running'] as const).map(key => (
            <button
              key={key}
              type="button"
              aria-pressed={metric === key}
              className={`min-h-9 border-b text-xs focus-visible:outline-2 ${metric === key ? 'border-current font-semibold' : 'border-transparent opacity-60'}`}
              onClick={() => {
                setMetric(key);
                setSelected(null);
              }}
            >
              {
                {
                  memory: 'Host RAM',
                  cpu: 'CPU cores',
                  running: 'Running state',
                }[key]
              }
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <RangeControl
          label="Windows VM"
          range={range}
          onChange={value => {
            setRange(value);
            setSelected(null);
          }}
        />
      </div>
      <p className="my-3 text-sm tabular-nums">
        <strong>
          {format(selectedBin ? selectedBin[metric] : currentValue)}
        </strong>
        <span className="ml-2 opacity-60">
          {selectedBin
            ? formatBin(selectedBin, timeZone)
            : null}
        </span>
      </p>
      <p className="mb-1 text-right text-xs tabular-nums opacity-60">
        {bins.every(bin => bin[metric] === null)
          ? 'No measurements in this range'
          : `0–${format(
              Math.max(
                metric === 'running'
                  ? 100
                  : metric === 'memory'
                    ? (vm?.allocated_gib ?? 1)
                    : 1,
                ...bins.flatMap(bin =>
                  bin[metric] === null ? [] : [bin[metric]!]
                )
              )
            )}`}
      </p>
      <TimelineBars
        bins={bins}
        values={bins.map(bin => bin[metric])}
        selectedIndex={selected}
        onSelect={index => setSelected(selected === index ? null : index)}
        color="bg-[#378690]"
        selectedColor="bg-[#205b63]"
        darkColor="dark:bg-[#66c0c8]"
        darkSelectedColor="dark:bg-[#99e1e5]"
        timeZone={timeZone}
        label="Windows VM"
        minimumMax={
          metric === 'running'
            ? 100
            : metric === 'memory'
              ? (vm?.allocated_gib ?? 1)
              : 1
        }
        formatValue={format}
      />
    </section>
  );
}

export function MachineHealthOverview({
  samples,
  codexSamples,
  now,
  currentByHost,
  windowsVm,
}: {
  samples: PublicMachineHealthSample[];
  codexSamples: CodexTokenSample[];
  now: number;
  currentByHost: Partial<Record<MachineHealthHost, MachineResourceSnapshot>>;
  windowsVm?: WindowsVm;
}) {
  const [resourceHost, setResourceHost] = useMachineDevice();
  const [usageSource, setUsageSource] = useState<MachineScope>('all');
  const usageSamples = useMemo(() => codexSamples.filter(sample => usageSource === 'all' || sample.source === usageSource), [codexSamples, usageSource]);
  const selectedResourceHost = currentByHost[resourceHost]
    ? resourceHost
    : 'big-red';
  const [resourceRange, setResourceRange] = useState<ActivityRange>('12h');
  const [resourceMetric, setResourceMetric] = useState<ResourceKey>('cpu');
  const [codexRange, setCodexRange] = useState<ActivityRange>('7d');
  const resourceSamples = useMemo(
    () => samples.filter(sample => sample.host === selectedResourceHost),
    [samples, selectedResourceHost]
  );
  const resourceBins = useMemo(
    () => buildPublicActivityBins(resourceSamples, resourceRange, now),
    [resourceSamples, resourceRange, now]
  );
  const resourceDuration =
    RANGE_CONFIG[resourceRange].bins * RANGE_CONFIG[resourceRange].binMs;
  const previousResourceBins = useMemo(
    () =>
      buildPublicActivityBins(
        resourceSamples,
        resourceRange,
        now - resourceDuration
      ),
    [resourceSamples, resourceRange, now, resourceDuration]
  );
  const codexBins = useMemo(
    () => buildCodexBins(usageSamples, codexRange, now),
    [usageSamples, codexRange, now]
  );
  const codexDuration =
    RANGE_CONFIG[codexRange].bins * RANGE_CONFIG[codexRange].binMs;
  const previousCodexBins = useMemo(
    () => buildCodexBins(usageSamples, codexRange, now - codexDuration),
    [usageSamples, codexRange, now, codexDuration]
  );

  return (
    <section aria-labelledby="activity-heading">
      <div className="mb-2 px-1">
        <h2
          id="activity-heading"
          className="scroll-mt-20 text-xl font-semibold tracking-tight"
        >
          History
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <h3 className="opacity-55 pb-1 text-sm font-medium">Resources</h3>
              {currentByHost['macbook-air'] ? <MachineSourceControl label="Resource device" value={selectedResourceHost} onChange={value => { if (value !== 'all') setResourceHost(value); }} /> : <span className="text-xs opacity-55">Big Red</span>}
            </div>
            <RangeControl
              label="Resource"
              range={resourceRange}
              onChange={setResourceRange}
            />
          </div>
          <ResourceHistory
            key={`resources-${selectedResourceHost}-${resourceRange}`}
            bins={resourceBins}
            previousBins={previousResourceBins}
            range={resourceRange}
            current={currentByHost[selectedResourceHost]!}
            metric={resourceMetric}
            onMetricChange={setResourceMetric}
          />
        </div>
        <div>
          <div className="min-h-9 mb-2 flex flex-wrap items-end justify-between gap-3 px-1">
            <div><h3 className="opacity-55 pb-1 text-sm font-medium">Codex usage</h3><MachineSourceControl label="Codex usage device" value={usageSource} onChange={setUsageSource} allowAll /></div>
            <RangeControl
              label="Codex"
              range={codexRange}
              onChange={setCodexRange}
            />
          </div>
          <CodexHistory
            key={`codex-${codexRange}`}
            bins={codexBins}
            previousBins={previousCodexBins}
          />
        </div>
      </div>

      <ModelUsage samples={usageSamples} from={codexBins[0].start} to={codexBins.at(-1)!.end} controls={<div className="flex flex-wrap items-center gap-x-6 gap-y-2"><MachineSourceControl label="Model usage device" value={usageSource} onChange={setUsageSource} allowAll /><RangeControl label="Model usage" range={codexRange} onChange={setCodexRange} /></div>} />
      <WindowsVmHistory samples={samples} current={windowsVm} now={now} />
      <PerformanceDetails bins={resourceBins} />
      <details className="mt-3 text-xs opacity-60">
        <summary className="cursor-pointer py-2">Data notes</summary>
        <ul className="max-w-prose list-disc space-y-1 pl-4 leading-relaxed">
          <li>Live: two-second samples each minute. One core = one busy logical CPU. History: hourly averages; gaps are missing samples.</li>
          <li>RAM includes VM memory, wired memory, and compressed memory. Air Blue’s available RAM is estimated. Older incompatible RAM readings are excluded.</li>
          <li>VM host RAM is peak resident memory, included in Big Red’s total. CPU includes virtualization overhead.</li>
          <li>Codex: complete hours from local logs. Input includes cached tokens; output includes reasoning. Overlapping reports are excluded.</li>
        </ul>
      </details>
    </section>
  );
}
