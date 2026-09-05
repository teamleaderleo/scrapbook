import type { PeerUsageSampleRow } from './agent-usage-store';

export type PeerUsageGroup = {
  provider: string;
  harness: string;
  model: string;
  effort: string | null;
  lane: string;
  hoursObserved: number;
  runs: number;
  runsUnknown: boolean;
  successfulRuns: number | null;
  inputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteInputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
  apiEquivalentEstimateUsd: number | null;
};

export function peerLaneLabel(harness: string): string {
  if (harness === 'claude-code') return 'Claude Code';
  if (harness === 'antigravity') return 'Antigravity';
  if (harness === 'muse') return 'Muse';
  return harness;
}

function addNullable(current: number | null, value: number | null): number | null {
  if (value === null) return current;
  return (current ?? 0) + value;
}

export function summarizePeerUsage(samples: PeerUsageSampleRow[]): PeerUsageGroup[] {
  const groups = new Map<string, PeerUsageGroup & { hours: Set<string> }>();
  for (const sample of samples) {
    const key = `${sample.provider}\u0000${sample.harness}\u0000${sample.model}\u0000${sample.effort ?? ''}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        provider: sample.provider,
        harness: sample.harness,
        model: sample.model,
        effort: sample.effort,
        lane: peerLaneLabel(sample.harness),
        hoursObserved: 0,
        hours: new Set<string>(),
        runs: 0,
        runsUnknown: true,
        successfulRuns: null,
        inputTokens: null,
        cachedInputTokens: null,
        cacheWriteInputTokens: null,
        outputTokens: null,
        reasoningTokens: null,
        totalTokens: null,
        apiEquivalentEstimateUsd: null,
      };
      groups.set(key, group);
    }
    group.hours.add(sample.observedAt);
    if (sample.requestCount !== null) {
      group.runs += sample.requestCount;
      group.runsUnknown = false;
    }
    group.successfulRuns = addNullable(group.successfulRuns, sample.successfulRequestCount);
    group.inputTokens = addNullable(group.inputTokens, sample.inputTokens);
    group.cachedInputTokens = addNullable(group.cachedInputTokens, sample.cachedInputTokens);
    group.cacheWriteInputTokens = addNullable(group.cacheWriteInputTokens, sample.cacheWriteInputTokens);
    group.outputTokens = addNullable(group.outputTokens, sample.outputTokens);
    group.reasoningTokens = addNullable(group.reasoningTokens, sample.reasoningTokens);
    group.totalTokens = addNullable(group.totalTokens, sample.totalTokens);
    if (sample.apiEquivalentEstimateUsd !== null)
      group.apiEquivalentEstimateUsd =
        (group.apiEquivalentEstimateUsd ?? 0) + sample.apiEquivalentEstimateUsd;
  }
  return [...groups.values()]
    .map(({ hours, ...group }) => ({ ...group, hoursObserved: hours.size }))
    .sort(
      (left, right) =>
        left.provider.localeCompare(right.provider) ||
        left.harness.localeCompare(right.harness) ||
        left.model.localeCompare(right.model) ||
        (left.effort ?? '').localeCompare(right.effort ?? '')
    );
}
