import { describe, expect, it } from 'vitest';
import { analyzeAgentEconomics } from './agent-economics-analysis';
import {
  agentEconomicsEnvelopeSchema,
  type AgentEconomicsSample,
} from './agent-economics-store';

function sample(
  overrides: Partial<AgentEconomicsSample> = {}
): AgentEconomicsSample {
  return {
    receiptSha256: `sha256:${'a'.repeat(64)}`,
    source: 'big-red',
    observedAt: '2026-09-01T01:00:00Z',
    provider: 'google-antigravity',
    model: 'gemini-3.7-flash-high',
    reasoningEffort: 'high',
    harness: 'agy',
    nodeId: 'big-red',
    inputTokens: 800,
    cachedInputTokens: 400,
    cacheWriteInputTokens: null,
    outputTokens: 200,
    reasoningTokens: 100,
    totalRecordedTokens: 1_000,
    requests: 1,
    turns: 1,
    agentSteps: 4,
    fiveHourQuotaDeltaPercent: 2,
    weeklyQuotaDeltaPercent: 1,
    fiveHourResetsAt: '2026-09-01T05:00:00Z',
    weeklyResetsAt: '2026-09-07T00:00:00Z',
    acceptedOutcome: 'accepted',
    verificationOutcome: 'passed',
    wallTimeMs: 30 * 60_000,
    retries: 0,
    operatorInterventionMinutes: 3,
    cleanupRework: 'none',
    subscriptionMonthlyDollars: 19.99,
    ...overrides,
  };
}

describe('agent task economics', () => {
  it('computes accepted-work units without filling unknown dimensions', () => {
    const summaries = analyzeAgentEconomics([
      sample(),
      sample({
        receiptSha256: `sha256:${'b'.repeat(64)}`,
        observedAt: '2026-09-01T02:00:00Z',
        acceptedOutcome: 'rejected',
        verificationOutcome: 'failed',
        totalRecordedTokens: null,
        fiveHourQuotaDeltaPercent: null,
        weeklyQuotaDeltaPercent: null,
        operatorInterventionMinutes: null,
      }),
    ]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      attempts: 2,
      acceptedTasks: 1,
      verifiedTasks: 1,
      recordedTokens: null,
      tokensPerAcceptedTask: null,
      fiveHourQuotaPercent: null,
      weeklyQuotaPercent: null,
      acceptedTasksPerFiveHourQuotaPercent: null,
      acceptedTasksPerWeeklyQuotaPercent: null,
      operatorMinutesPerAcceptedTask: null,
    });
    expect(summaries[0].acceptedTasksPerSubscriptionDollar).toBeCloseTo(
      1 / 19.99,
      3
    );

    const complete = analyzeAgentEconomics([
      sample(),
      sample({
        receiptSha256: `sha256:${'c'.repeat(64)}`,
        observedAt: '2026-09-01T02:00:00Z',
        acceptedOutcome: 'rejected',
        verificationOutcome: 'failed',
        totalRecordedTokens: 500,
        fiveHourQuotaDeltaPercent: 1,
        weeklyQuotaDeltaPercent: 0.5,
        operatorInterventionMinutes: 0,
      }),
    ])[0]!;
    expect(complete).toMatchObject({
      recordedTokens: 1_500,
      tokensPerAcceptedTask: 1_500,
      fiveHourQuotaPercent: 3,
      weeklyQuotaPercent: 1.5,
      acceptedTasksPerFiveHourQuotaPercent: 0.333,
      acceptedTasksPerWeeklyQuotaPercent: 0.667,
      operatorMinutesPerAcceptedTask: 3,
    });
  });

  it('rejects leaked fields and acceptance without passed verification', () => {
    const base = {
      schema: 'agent-task-settlement-report/v1',
      source: 'big-red',
      collected_at: '2026-09-01T01:05:00Z',
      samples: [
        {
          receipt_sha256: `sha256:${'a'.repeat(64)}`,
          usage_sample_id: 'attempt-1',
          observed_at: '2026-09-01T01:00:00Z',
          provider: 'google-antigravity',
          harness: 'agy',
          five_hour_quota_delta_percent: null,
          weekly_quota_delta_percent: null,
          five_hour_resets_at: null,
          weekly_resets_at: null,
          accepted_outcome: 'accepted',
          verification_outcome: 'passed',
          wall_time_ms: 1_000,
          retries: 0,
          operator_intervention_minutes: null,
          cleanup_rework: 'none',
          subscription_monthly_dollars: null,
        },
      ],
    };
    expect(agentEconomicsEnvelopeSchema.safeParse(base).success).toBe(true);
    expect(
      agentEconomicsEnvelopeSchema.safeParse({
        ...base,
        samples: [{ ...base.samples[0], verification_outcome: 'failed' }],
      }).success
    ).toBe(false);
    expect(
      agentEconomicsEnvelopeSchema.safeParse({
        ...base,
        samples: [
          { ...base.samples[0], provider: '/home/leo/private' },
        ],
      }).success
    ).toBe(false);
  });
});
