'use client';

import {
  analyzeCodexQuotaBurn,
  QUOTA_MILESTONES,
} from '@/app/lib/codex-quota-analysis';
import type { CodexQuotaSample } from '@/app/lib/codex-quota-store';
import type { CodexTokenSample } from '@/app/lib/machine-health-store';
import { useMemo } from 'react';

function bucketLabel(minutes: number) {
  if (minutes === 300) return '5-hour';
  if (minutes === 10_080) return 'Weekly';
  if (minutes % 1_440 === 0) return `${minutes / 1_440}-day`;
  if (minutes % 60 === 0) return `${minutes / 60}-hour`;
  return `${minutes}-minute`;
}

function resetLabel(value: string | null) {
  if (!value) return 'reset time unavailable';
  return `resets ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))}`;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function observedLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function CodexQuotaPanel({
  samples,
  tokenSamples,
}: {
  samples: CodexQuotaSample[];
  tokenSamples: CodexTokenSample[];
}) {
  const { buckets, burn } = useMemo(
    () => {
      const latest = new Map<string, CodexQuotaSample>();
      for (const sample of samples)
        latest.set(String(sample.windowMinutes), sample);
      return {
        buckets: [...latest.values()].sort(
          (left, right) => right.windowMinutes - left.windowMinutes
        ),
        burn: analyzeCodexQuotaBurn(samples, tokenSamples),
      };
    },
    [samples, tokenSamples]
  );
  if (samples.length === 0) return null;
  const saturationRanges = [0, 25, 50, 75].map(fromPercent => ({
    fromPercent,
    interval:
      burn?.lastSaturation?.ranges.find(
        range => range.fromPercent === fromPercent
      ) ?? null,
  }));

  return (
    <section className="mt-4 border-t border-black/15 pt-4 dark:border-white/15">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold tracking-tight">Codex allowance</h2>
        <p className="text-[0.68rem] opacity-45">
          Private · session rate-limit receipts
        </p>
      </div>
      <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {buckets.map(bucket => {
          const remaining = Math.max(0, 100 - bucket.usedPercent);
          return (
            <div
              key={`${bucket.limitId}-${bucket.windowMinutes}`}
              className="border-black/10 border-l pl-3 dark:border-white/10"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs font-medium opacity-60">
                  {bucketLabel(bucket.windowMinutes)}
                </span>
                <span className="font-mono text-lg tabular-nums">
                  {remaining.toFixed(remaining % 1 === 0 ? 0 : 1)}% left
                </span>
              </div>
              <div className="mt-1 flex flex-wrap justify-between gap-x-4 text-[0.68rem] tabular-nums opacity-45">
                <span>{bucket.usedPercent.toFixed(1)}% used</span>
                <span>{resetLabel(bucket.resetsAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
      {burn?.current ? (
        <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-xs font-semibold">Weekly burn milestones</h3>
            <span className="text-[0.68rem] tabular-nums opacity-45">
              observed {observedLabel(burn.current.observedAt)}
            </span>
          </div>

          <div className="mt-3">
            <div
              className="relative h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
              role="progressbar"
              aria-label="Weekly Codex quota used"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={burn.current.usedPercent}
            >
              <div
                className="h-full rounded-full bg-[#a53b34] dark:bg-[#e27c72]"
                style={{ width: `${Math.min(100, burn.current.usedPercent)}%` }}
              />
            </div>
            <div className="relative mt-1 h-4 font-mono text-[0.58rem] opacity-45">
              {QUOTA_MILESTONES.map(milestone => (
                <span
                  key={milestone}
                  className="absolute -translate-x-1/2 tabular-nums first:translate-x-0 last:-translate-x-full"
                  style={{ left: `${milestone}%` }}
                >
                  {milestone}%
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[0.65rem] opacity-45">Current cycle</p>
              <p className="mt-0.5 font-mono text-base tabular-nums">
                {compactNumber(burn.current.recordedTokensSinceReset)} tokens
              </p>
              <p className="text-[0.65rem] tabular-nums opacity-45">
                0→{burn.current.usedPercent}% ·{' '}
                {compactNumber(burn.current.modelCallsSinceReset)} calls
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] opacity-45">Linear 100% estimate</p>
              <p className="mt-0.5 font-mono text-base tabular-nums">
                {burn.current.projectedTokensAt100 === null
                  ? 'Not enough signal'
                  : `${compactNumber(burn.current.projectedTokensAt100)} tokens`}
              </p>
              <p className="text-[0.65rem] opacity-45">
                projected from this cycle
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] opacity-45">Last saturation</p>
              <p className="mt-0.5 font-mono text-base tabular-nums">
                {burn.lastSaturation
                  ? observedLabel(burn.lastSaturation.reachedAt)
                  : 'Not observed'}
              </p>
              <p className="text-[0.65rem] opacity-45">first 100% receipt</p>
            </div>
          </div>

          {burn.currentBands.length > 0 ? (
            <div className="mt-4">
              <p className="text-[0.65rem] font-medium opacity-60">
                Current-cycle crossings
              </p>
              <div className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {burn.currentBands.map(band => (
                  <div
                    key={`${band.fromPercent}-${band.toPercent}`}
                    className="flex items-baseline justify-between gap-4 text-[0.68rem] tabular-nums"
                  >
                    <span className="opacity-45">
                      {band.fromPercent}→{band.toPercent}%
                    </span>
                    <span>{compactNumber(band.recordedTokens)} tokens</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {burn.lastSaturation ? (
            <div className="mt-4">
              <p className="text-[0.65rem] font-medium opacity-60">
                Last cycle to 100%
              </p>
              <div className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-4">
                {saturationRanges.map(({ fromPercent, interval }) => (
                  <div
                    key={fromPercent}
                    className="flex items-baseline justify-between gap-3 text-[0.68rem] tabular-nums sm:block"
                  >
                    <span className="opacity-45">{fromPercent}→100%</span>
                    <span className="sm:mt-0.5 sm:block">
                      {interval
                        ? `${compactNumber(interval.recordedTokens)} tokens`
                        : 'Start not observed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-4 max-w-3xl text-[0.62rem] leading-relaxed opacity-40">
            Recorded local tokens are allocated proportionally from hourly token
            totals between exact quota crossings. This is an extrapolation proxy,
            not OpenAI&apos;s quota formula; resets and unobserved Codex activity can
            break linearity.
          </p>
        </div>
      ) : null}
    </section>
  );
}
