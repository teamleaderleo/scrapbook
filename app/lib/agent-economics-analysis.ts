import type { AgentEconomicsSample } from './agent-economics-store';

export type AgentEconomicsSummary = {
  key: string;
  provider: string;
  model: string;
  reasoningEffort: string;
  harness: string;
  attempts: number;
  acceptedTasks: number;
  verifiedTasks: number;
  recordedTokens: number | null;
  tokensPerAcceptedTask: number | null;
  fiveHourQuotaPercent: number | null;
  weeklyQuotaPercent: number | null;
  acceptedTasksPerFiveHourQuotaPercent: number | null;
  acceptedTasksPerWeeklyQuotaPercent: number | null;
  acceptedTasksPerSubscriptionDollar: number | null;
  acceptedTasksPerWallClockHourPerQuotaPercent: number | null;
  operatorMinutesPerAcceptedTask: number | null;
  latestObservedAt: string;
};

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function rounded(value: number | null, digits = 3): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function analyzeAgentEconomics(
  samples: AgentEconomicsSample[]
): AgentEconomicsSummary[] {
  const groups = new Map<string, AgentEconomicsSample[]>();
  for (const sample of samples) {
    const key = [
      sample.provider,
      sample.model,
      sample.reasoningEffort,
      sample.harness,
    ].join('\u0000');
    const group = groups.get(key) ?? [];
    group.push(sample);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .map(([key, group]) => {
      const acceptedTasks = group.filter(
        sample => sample.acceptedOutcome === 'accepted'
      ).length;
      const verifiedTasks = group.filter(
        sample => sample.verificationOutcome === 'passed'
      ).length;
      const tokenCoverageComplete = group.every(
        sample => sample.totalRecordedTokens !== null
      );
      const recordedTokens = tokenCoverageComplete
        ? group.reduce(
            (total, sample) => total + (sample.totalRecordedTokens ?? 0),
            0
          )
        : null;
      const fiveHourCoverageComplete = group.every(
        sample => sample.fiveHourQuotaDeltaPercent !== null
      );
      const weeklyCoverageComplete = group.every(
        sample => sample.weeklyQuotaDeltaPercent !== null
      );
      const fiveHourQuotaPercent = fiveHourCoverageComplete
        ? group.reduce(
            (total, sample) =>
              total + (sample.fiveHourQuotaDeltaPercent ?? 0),
            0
          )
        : null;
      const weeklyQuotaPercent = weeklyCoverageComplete
        ? group.reduce(
            (total, sample) => total + (sample.weeklyQuotaDeltaPercent ?? 0),
            0
          )
        : null;
      const wallHours =
        group.reduce((total, sample) => total + sample.wallTimeMs, 0) /
        3_600_000;
      const operatorCoverageComplete = group.every(
        sample => sample.operatorInterventionMinutes !== null
      );
      const operatorMinutes = group.reduce(
        (total, sample) =>
          total + (sample.operatorInterventionMinutes ?? 0),
        0
      );
      const latest = [...group].sort(
        (left, right) =>
          Date.parse(right.observedAt) - Date.parse(left.observedAt)
      )[0]!;
      const subscriptionDollars = latest.subscriptionMonthlyDollars;
      return {
        key,
        provider: latest.provider,
        model: latest.model,
        reasoningEffort: latest.reasoningEffort,
        harness: latest.harness,
        attempts: group.length,
        acceptedTasks,
        verifiedTasks,
        recordedTokens,
        tokensPerAcceptedTask: rounded(
          recordedTokens === null
            ? null
            : ratio(recordedTokens, acceptedTasks),
          0
        ),
        fiveHourQuotaPercent,
        weeklyQuotaPercent,
        acceptedTasksPerFiveHourQuotaPercent: rounded(
          fiveHourQuotaPercent === null
            ? null
            : ratio(acceptedTasks, fiveHourQuotaPercent)
        ),
        acceptedTasksPerWeeklyQuotaPercent: rounded(
          weeklyQuotaPercent === null
            ? null
            : ratio(acceptedTasks, weeklyQuotaPercent)
        ),
        acceptedTasksPerSubscriptionDollar: rounded(
          subscriptionDollars === null
            ? null
            : ratio(acceptedTasks, subscriptionDollars)
        ),
        acceptedTasksPerWallClockHourPerQuotaPercent: rounded(
          fiveHourQuotaPercent === null
            ? null
            : ratio(acceptedTasks, wallHours * fiveHourQuotaPercent)
        ),
        operatorMinutesPerAcceptedTask: operatorCoverageComplete
          ? rounded(ratio(operatorMinutes, acceptedTasks))
          : null,
        latestObservedAt: latest.observedAt,
      };
    })
    .sort(
      (left, right) =>
        right.acceptedTasks - left.acceptedTasks ||
        Date.parse(right.latestObservedAt) - Date.parse(left.latestObservedAt)
    );
}
