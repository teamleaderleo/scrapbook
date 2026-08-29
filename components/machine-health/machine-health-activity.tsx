'use client';

import type { MachineHealthSample } from '@/app/lib/machine-health-store';
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
  browserRoots: number | null;
  codexWorkers: number | null;
};

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

export function buildActivityBins(
  samples: MachineHealthSample[],
  range: ActivityRange,
  now: number
): ActivityBin[] {
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
    const graphicsClocks = included
      .map(sample => sample.graphicsClockMhz)
      .filter((value): value is number => value !== null);

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
      browserRoots:
        included.length === 0
          ? null
          : Math.max(...included.map(sample => sample.browserRoots)),
      codexWorkers:
        included.length === 0
          ? null
          : Math.max(...included.map(sample => sample.codexWorkers)),
    };
  });
}

function formatValue(value: number | null, unit: string) {
  if (value === null) return '—';
  if (unit === '%') return `${Math.round(value)}%`;
  if (unit === 'MHz') return `${Math.round(value)} MHz`;
  return `${value.toFixed(value < 10 ? 2 : 1)} ${unit}`;
}

function ObservationChart({
  label,
  bins,
  value,
  ceiling,
  unit,
}: {
  label: string;
  bins: ActivityBin[];
  value: (bin: ActivityBin) => number | null;
  ceiling?: number;
  unit: string;
}) {
  const values = bins.map(value);
  const present = values.filter((item): item is number => item !== null);
  const max = Math.max(ceiling ?? 0, ...present, 1);
  const latest = present.at(-1) ?? null;

  return (
    <article className="bg-white/55 dark:bg-black/15 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-black">{label}</h3>
        <span className="font-mono text-xs tabular-nums opacity-60">
          {formatValue(latest, unit)}
        </span>
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
            title={item === null ? 'No observation' : formatValue(item, unit)}
          />
        ))}
      </div>
    </article>
  );
}

export function MachineHealthActivity({
  samples,
  now,
  graphicsMaxClockMhz,
}: {
  samples: MachineHealthSample[];
  now: number;
  graphicsMaxClockMhz: number | null;
}) {
  const [range, setRange] = useState<ActivityRange>('24h');
  const bins = useMemo(
    () => buildActivityBins(samples, range, now),
    [samples, range, now]
  );
  const observedBins = bins.filter(bin => bin.sampleCount > 0).length;
  const browserHigh = Math.max(0, ...bins.map(bin => bin.browserRoots ?? 0));
  const workerHigh = Math.max(0, ...bins.map(bin => bin.codexWorkers ?? 0));

  return (
    <section className="rounded-2xl border border-black/10 bg-[#e4ded2]/75 p-4 dark:border-white/10 dark:bg-[#17191f]/80 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-[#8c302b] dark:text-[#ef8f87]">
            Activity field
          </p>
          <h2 className="mt-1 text-lg font-black">Observed, not surveilled</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 opacity-60">
            Short point samples show workstation shape without recording apps,
            tabs, commands, or literal screen time.
          </p>
        </div>
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
          label="CPU"
          bins={bins}
          value={bin => bin.cpuUsedPercent}
          ceiling={100}
          unit="%"
        />
        <ObservationChart
          label="Memory"
          bins={bins}
          value={bin => bin.memoryUsedPercent}
          ceiling={100}
          unit="%"
        />
        <ObservationChart
          label="Network"
          bins={bins}
          value={bin => bin.networkMibS}
          unit="MiB/s"
        />
        <ObservationChart
          label="iGPU clock"
          bins={bins}
          value={bin => bin.graphicsClockMhz}
          ceiling={graphicsMaxClockMhz ?? undefined}
          unit="MHz"
        />
      </div>

      <div className="opacity-55 mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-black/10 pt-3 text-xs dark:border-white/10">
        <span>
          {observedBins}/{bins.length} {RANGE_CONFIG[range].description} bins
          observed
        </span>
        <span>Browser-root high {browserHigh}</span>
        <span>Codex-worker high {workerHigh}</span>
        <span>Empty bins stay visible</span>
      </div>
    </section>
  );
}
