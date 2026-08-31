import type { CodexQuotaSample } from './codex-quota-store';
import type { CodexTokenSample } from './machine-health-store';

export const QUOTA_MILESTONES = [0, 10, 25, 50, 75, 100] as const;

export type CodexQuotaBurnInterval = {
  fromPercent: number;
  toPercent: number;
  startedAt: string;
  endedAt: string;
  recordedTokens: number;
  modelCalls: number;
  durationHours: number;
};

export type CodexQuotaBurnSummary = {
  windowMinutes: number;
  current: {
    usedPercent: number;
    observedAt: string;
    resetsAt: string | null;
    recordedTokensSinceReset: number;
    modelCallsSinceReset: number;
    projectedTokensAt100: number | null;
  } | null;
  currentBands: CodexQuotaBurnInterval[];
  lastSaturation: {
    reachedAt: string;
    ranges: CodexQuotaBurnInterval[];
    bands: CodexQuotaBurnInterval[];
  } | null;
};

type TimedQuotaSample = CodexQuotaSample & {
  observedMs: number;
  resetMs: number;
};

type QuotaCycle = {
  samples: TimedQuotaSample[];
  crossings: Map<number, TimedQuotaSample>;
  start: TimedQuotaSample | null;
  maximumUsedPercent: number;
};

const MINUTE_MS = 60_000;

function intervalTotals(
  tokenSamples: CodexTokenSample[],
  startedAt: number,
  endedAt: number
) {
  let recordedTokens = 0;
  let modelCalls = 0;
  for (const sample of tokenSamples) {
    if (sample.accountingState !== 'counted') continue;
    const windowStart = Date.parse(sample.windowStartedAt);
    const windowEnd = Date.parse(sample.windowEndedAt);
    const overlap = Math.max(
      0,
      Math.min(endedAt, windowEnd) - Math.max(startedAt, windowStart)
    );
    if (overlap === 0 || windowEnd <= windowStart) continue;
    const share = overlap / (windowEnd - windowStart);
    recordedTokens += sample.totalTokens * share;
    modelCalls += sample.modelCalls * share;
  }
  return {
    recordedTokens: Math.round(recordedTokens),
    modelCalls: Math.round(modelCalls),
  };
}

function burnInterval(
  fromPercent: number,
  toPercent: number,
  start: TimedQuotaSample,
  end: TimedQuotaSample,
  tokenSamples: CodexTokenSample[]
): CodexQuotaBurnInterval | null {
  if (end.observedMs <= start.observedMs) return null;
  return {
    fromPercent,
    toPercent,
    startedAt: start.observedAt,
    endedAt: end.observedAt,
    ...intervalTotals(tokenSamples, start.observedMs, end.observedMs),
    durationHours:
      Math.round(((end.observedMs - start.observedMs) / 3_600_000) * 100) / 100,
  };
}

function cycleIntervals(
  cycle: QuotaCycle,
  tokenSamples: CodexTokenSample[]
) {
  const milestone = (value: number) =>
    value === 0 ? cycle.start : (cycle.crossings.get(value) ?? null);
  const bands: CodexQuotaBurnInterval[] = [];
  for (let index = 1; index < QUOTA_MILESTONES.length; index += 1) {
    const fromPercent = QUOTA_MILESTONES[index - 1];
    const toPercent = QUOTA_MILESTONES[index];
    const start = milestone(fromPercent);
    const end = milestone(toPercent);
    if (!start || !end) continue;
    const interval = burnInterval(
      fromPercent,
      toPercent,
      start,
      end,
      tokenSamples
    );
    if (interval) bands.push(interval);
  }

  const ranges: CodexQuotaBurnInterval[] = [];
  const saturation = milestone(100);
  if (saturation) {
    for (const fromPercent of [0, 25, 50, 75]) {
      const start = milestone(fromPercent);
      if (!start) continue;
      const interval = burnInterval(
        fromPercent,
        100,
        start,
        saturation,
        tokenSamples
      );
      if (interval) ranges.push(interval);
    }
  }
  return { bands, ranges };
}

function quotaCycles(samples: TimedQuotaSample[]) {
  const grouped = new Map<number, TimedQuotaSample[]>();
  for (const sample of samples) {
    const resetMinute = Math.floor(sample.resetMs / MINUTE_MS);
    const cycle = grouped.get(resetMinute) ?? [];
    cycle.push(sample);
    grouped.set(resetMinute, cycle);
  }

  return [...grouped.values()].map(items => {
    items.sort((left, right) => left.observedMs - right.observedMs);
    const crossings = new Map<number, TimedQuotaSample>();
    let maximumUsedPercent = -1;
    let start: TimedQuotaSample | null = null;
    for (const sample of items) {
      if (start === null && sample.usedPercent <= 1) start = sample;
      for (const milestone of QUOTA_MILESTONES.slice(1)) {
        if (
          !crossings.has(milestone) &&
          maximumUsedPercent < milestone &&
          sample.usedPercent >= milestone
        )
          crossings.set(milestone, sample);
      }
      maximumUsedPercent = Math.max(maximumUsedPercent, sample.usedPercent);
    }
    return { samples: items, crossings, start, maximumUsedPercent };
  });
}

export function analyzeCodexQuotaBurn(
  quotaSamples: CodexQuotaSample[],
  tokenSamples: CodexTokenSample[]
): CodexQuotaBurnSummary | null {
  const candidates = new Map<string, CodexQuotaSample[]>();
  for (const sample of quotaSamples) {
    if (sample.resetsAt === null || sample.windowMinutes < 1_440) continue;
    const key = `${sample.limitId}\u0000${sample.windowMinutes}`;
    const group = candidates.get(key) ?? [];
    group.push(sample);
    candidates.set(key, group);
  }
  const selected = [...candidates.values()]
    .map(samples => ({
      samples,
      windowMinutes: samples[0].windowMinutes,
      movement:
        Math.max(...samples.map(sample => sample.usedPercent)) -
        Math.min(...samples.map(sample => sample.usedPercent)),
      latest: Math.max(...samples.map(sample => Date.parse(sample.observedAt))),
    }))
    .filter(candidate => candidate.movement > 0)
    .sort(
      (left, right) =>
        right.windowMinutes - left.windowMinutes ||
        right.movement - left.movement ||
        right.latest - left.latest
    )[0];
  if (!selected) return null;

  const timedSamples = selected.samples
    .map(sample => ({
      ...sample,
      observedMs: Date.parse(sample.observedAt),
      resetMs: Date.parse(sample.resetsAt as string),
    }))
    .filter(sample =>
      Number.isFinite(sample.observedMs) && Number.isFinite(sample.resetMs)
    );
  const cycles = quotaCycles(timedSamples).sort((left, right) => {
    const leftLatest = left.samples.at(-1)?.observedMs ?? 0;
    const rightLatest = right.samples.at(-1)?.observedMs ?? 0;
    return leftLatest - rightLatest;
  });
  const latestCycle = cycles.at(-1) ?? null;
  if (!latestCycle) return null;

  const latestSample = latestCycle.samples.at(-1) ?? null;
  const currentUsedPercent = latestCycle.maximumUsedPercent;
  let current: CodexQuotaBurnSummary['current'] = null;
  if (latestSample && latestCycle.start && currentUsedPercent > 0) {
    const totals = intervalTotals(
      tokenSamples,
      latestCycle.start.observedMs,
      latestSample.observedMs
    );
    current = {
      usedPercent: currentUsedPercent,
      observedAt: latestSample.observedAt,
      resetsAt: latestSample.resetsAt,
      recordedTokensSinceReset: totals.recordedTokens,
      modelCallsSinceReset: totals.modelCalls,
      projectedTokensAt100:
        currentUsedPercent >= 10
          ? Math.round((totals.recordedTokens / currentUsedPercent) * 100)
          : null,
    };
  }

  const completedCycle = [...cycles]
    .reverse()
    .find(cycle => cycle.crossings.has(100));
  const currentIntervals = cycleIntervals(latestCycle, tokenSamples);
  const completedIntervals = completedCycle
    ? cycleIntervals(completedCycle, tokenSamples)
    : null;
  return {
    windowMinutes: selected.windowMinutes,
    current,
    currentBands: currentIntervals.bands,
    lastSaturation:
      completedCycle && completedIntervals
        ? {
            reachedAt: completedCycle.crossings.get(100)!.observedAt,
            ranges: completedIntervals.ranges,
            bands: completedIntervals.bands,
          }
        : null,
  };
}
