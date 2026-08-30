'use client';

import type {
  CodexTokenSample,
  CodexTokenSource,
} from '@/app/lib/machine-health-store';
import { useMemo, useState, useSyncExternalStore } from 'react';

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
  checkedAt: string;
  cpuUsedPercent: number;
  memoryUsedPercent: number;
  rootUsedPercent: number;
  networkRxMibS: number;
  networkTxMibS: number;
  diskReadMibS: number | null;
  diskWriteMibS: number | null;
  pressurePercent: number | null;
};

type PublicActivityBin = {
  start: number;
  end: number;
  sampleCount: number;
  cpuUsedPercent: number | null;
  memoryUsedPercent: number | null;
  rootUsedPercent: number | null;
  networkMibS: number | null;
  diskMibS: number | null;
  pressurePercent: number | null;
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
    value: (bin: PublicActivityBin) => number | null;
  }
> = {
  cpu: {
    label: 'CPU',
    color: 'bg-[#b74a42]',
    selectedColor: 'bg-[#7f2d28]',
    darkColor: 'dark:bg-[#e77970]',
    darkSelectedColor: 'dark:bg-[#ffaaa2]',
    value: bin => bin.cpuUsedPercent,
  },
  memory: {
    label: 'Memory',
    color: 'bg-[#378690]',
    selectedColor: 'bg-[#205b63]',
    darkColor: 'dark:bg-[#66c0c8]',
    darkSelectedColor: 'dark:bg-[#99e1e5]',
    value: bin => bin.memoryUsedPercent,
  },
  storage: {
    label: 'Storage',
    color: 'bg-[#b98532]',
    selectedColor: 'bg-[#7d581d]',
    darkColor: 'dark:bg-[#e2b660]',
    darkSelectedColor: 'dark:bg-[#ffd58a]',
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

function buildPublicActivityBins(
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
    return {
      start: binStart,
      end: binEnd,
      sampleCount: included.length,
      cpuUsedPercent: average(included.map(sample => sample.cpuUsedPercent)),
      memoryUsedPercent: average(
        included.map(sample => sample.memoryUsedPercent)
      ),
      rootUsedPercent: average(included.map(sample => sample.rootUsedPercent)),
      networkMibS: average(
        included.map(sample => sample.networkRxMibS + sample.networkTxMibS)
      ),
      diskMibS: average(diskValues),
      pressurePercent:
        pressureValues.length === 0 ? null : Math.max(...pressureValues),
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
}: {
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
    100,
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
                aria-label={`${formatBin(bin, timeZone)}: ${percent(value)}`}
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
}: {
  bins: PublicActivityBin[];
  previousBins: PublicActivityBin[];
  range: ActivityRange;
  current: MachineResourceSnapshot;
}) {
  const [metric, setMetric] = useState<ResourceKey>('cpu');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    getServerTimeZone
  );
  const config = RESOURCE_CONFIG[metric];
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
                : RANGE_CONFIG[range].averageLabel}
            </p>
            <p className="mt-0.5 text-[2.15rem] font-semibold tabular-nums leading-none tracking-[-0.045em]">
              {percent(headline)}
            </p>
          </div>
          <div className="pt-0.5 text-right text-xs">
            <p className="font-semibold">{config.label}</p>
            {delta !== null && Math.abs(delta) >= 0.5 ? (
              <p className="opacity-45 mt-1 tabular-nums">
                {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(0)} points
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

      <div className="border-black/9 border-t dark:border-white/10">
        {(Object.keys(RESOURCE_CONFIG) as ResourceKey[]).map(key => {
          const item = RESOURCE_CONFIG[key];
          const itemValues = bins
            .map(item.value)
            .filter((value): value is number => value !== null);
          const high = itemValues.length ? Math.max(...itemValues) : null;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={metric === key}
              onClick={() => {
                setMetric(key);
                setSelectedIndex(null);
              }}
              className="grid min-h-[3.45rem] w-full grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 border-b border-black/[0.055] px-5 py-2.5 text-left last:border-b-0 hover:bg-black/[0.025] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#a53b34] dark:border-white/[0.065] dark:hover:bg-white/[0.035]"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`size-2 shrink-0 rounded-full ${item.color} ${item.darkColor}`}
                />
                <span>
                  <span className="block text-[0.95rem] font-medium leading-tight">
                    {item.label}
                  </span>
                  <span className="opacity-45 mt-1 block text-[0.72rem] leading-none">
                    {key === 'storage'
                      ? `${Math.round(current.storageFreeGib)} GiB free`
                      : high === null
                        ? 'No range data'
                        : `${percent(high)} high`}
                  </span>
                </span>
              </span>
              <span className="text-right text-[1.05rem] font-semibold tabular-nums tracking-[-0.02em]">
                {percent(currentValues[key])}
              </span>
            </button>
          );
        })}
      </div>
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
    'macbook-air': 'MacBook Air',
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
            <p className="font-semibold">Codex</p>
            {selectedIndex === null && previousInput > 0 ? (
              <p className="opacity-45 mt-1 tabular-nums">
                {totalInput >= previousInput ? '↑' : '↓'}{' '}
                {compactNumber(Math.abs(totalInput - previousInput))} vs prior
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
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-sm ${source === 'big-red' ? 'bg-[#b74a42] dark:bg-[#e77970]' : 'bg-[#378690] dark:bg-[#66c0c8]'}`}
                />
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
            <span className="block text-[0.95rem] leading-tight">Output</span>
            <span className="opacity-45 mt-1 block text-[0.72rem] leading-none">
              {compactNumber(reasoning)} reasoning
            </span>
          </dt>
          <dd className="text-right font-medium tabular-nums leading-none">
            {compactNumber(totalOutput)}
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
            <span className="opacity-45 mt-1 block text-[0.72rem] leading-none">
              {observedHours} accounted hour{observedHours === 1 ? '' : 's'}
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

function PerformanceDetails({
  bins,
  range,
}: {
  bins: PublicActivityBin[];
  range: ActivityRange;
}) {
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
  const observed = bins.filter(bin => bin.sampleCount > 0).length;

  return (
    <details className="border-t border-black/10 py-1 dark:border-white/10">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium opacity-60 hover:opacity-100">
        Performance details
      </summary>
      <dl className="pb-2 text-sm">
        <div className="border-black/7 dark:border-white/8 flex justify-between gap-4 border-t py-3">
          <dt className="opacity-60">Network average</dt>
          <dd className="font-medium tabular-nums">
            {formatThroughput(network)}
          </dd>
        </div>
        <div className="border-black/7 dark:border-white/8 flex justify-between gap-4 border-t py-3">
          <dt className="opacity-60">Disk I/O average</dt>
          <dd className="font-medium tabular-nums">{formatThroughput(disk)}</dd>
        </div>
        <div className="border-black/7 dark:border-white/8 flex justify-between gap-4 border-t py-3">
          <dt className="opacity-60">Peak contention</dt>
          <dd className="font-medium tabular-nums">{percent(pressure)}</dd>
        </div>
        {observed < bins.length ? (
          <div className="border-black/7 dark:border-white/8 flex justify-between gap-4 border-t py-3">
            <dt className="opacity-60">Observed</dt>
            <dd className="font-medium tabular-nums">
              {observed} of {RANGE_CONFIG[range].bins} buckets
            </dd>
          </div>
        ) : null}
      </dl>
    </details>
  );
}

export function MachineHealthOverview({
  samples,
  codexSamples,
  now,
  current,
}: {
  samples: PublicMachineHealthSample[];
  codexSamples: CodexTokenSample[];
  now: number;
  current: MachineResourceSnapshot;
}) {
  const [resourceRange, setResourceRange] = useState<ActivityRange>('12h');
  const [codexRange, setCodexRange] = useState<ActivityRange>('7d');
  const resourceBins = useMemo(
    () => buildPublicActivityBins(samples, resourceRange, now),
    [samples, resourceRange, now]
  );
  const resourceDuration =
    RANGE_CONFIG[resourceRange].bins * RANGE_CONFIG[resourceRange].binMs;
  const previousResourceBins = useMemo(
    () =>
      buildPublicActivityBins(samples, resourceRange, now - resourceDuration),
    [samples, resourceRange, now, resourceDuration]
  );
  const codexBins = useMemo(
    () => buildCodexBins(codexSamples, codexRange, now),
    [codexSamples, codexRange, now]
  );
  const codexDuration =
    RANGE_CONFIG[codexRange].bins * RANGE_CONFIG[codexRange].binMs;
  const previousCodexBins = useMemo(
    () => buildCodexBins(codexSamples, codexRange, now - codexDuration),
    [codexSamples, codexRange, now, codexDuration]
  );

  return (
    <section aria-labelledby="activity-heading">
      <div className="mb-2 px-1">
        <h2
          id="activity-heading"
          className="text-xl font-semibold tracking-tight"
        >
          Activity
        </h2>
        <p className="opacity-45 mt-0.5 text-xs">Big Red and Codex over time</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div>
          <div className="min-h-9 mb-2 flex items-end justify-between gap-3 px-1">
            <h3 className="opacity-55 pb-2 text-sm font-medium">Resources</h3>
            <RangeControl
              label="Resource"
              range={resourceRange}
              onChange={setResourceRange}
            />
          </div>
          <ResourceHistory
            key={`resources-${resourceRange}`}
            bins={resourceBins}
            previousBins={previousResourceBins}
            range={resourceRange}
            current={current}
          />
        </div>
        <div>
          <div className="min-h-9 mb-2 flex items-end justify-between gap-3 px-1">
            <h3 className="opacity-55 pb-2 text-sm font-medium">Usage</h3>
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

      <PerformanceDetails bins={resourceBins} range={resourceRange} />
    </section>
  );
}
