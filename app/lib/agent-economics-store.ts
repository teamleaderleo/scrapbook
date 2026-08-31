import { client } from '@/app/lib/db/db';
import { z } from 'zod';

const counter = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const percent = z.number().finite().min(0).max(100).nullable();
const identity = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9_.:/@#+=\-]*$/);

export const agentEconomicsSampleSchema = z.object({
  receipt_sha256: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  usage_sample_id: identity,
  observed_at: z.string().datetime({ offset: true }),
  provider: identity,
  harness: identity,
  accepted_outcome: z.enum(['accepted', 'rejected', 'partial']),
  verification_outcome: z.enum(['passed', 'failed', 'not_run']),
  wall_time_ms: counter,
  retries: counter,
  operator_intervention_minutes: z.number().finite().nonnegative().nullable(),
  cleanup_rework: z.enum(['none', 'required']),
  five_hour_quota_delta_percent: percent,
  weekly_quota_delta_percent: percent,
  five_hour_resets_at: z.string().datetime({ offset: true }).nullable(),
  weekly_resets_at: z.string().datetime({ offset: true }).nullable(),
  subscription_monthly_dollars: z.number().finite().positive().nullable(),
}).strict().superRefine((sample, context) => {
  if (sample.accepted_outcome === 'accepted' && sample.verification_outcome !== 'passed')
    context.addIssue({
      code: 'custom',
      path: ['verification_outcome'],
      message: 'Accepted work requires passed external verification',
    });
});

export const agentEconomicsEnvelopeSchema = z.object({
  schema: z.literal('agent-task-settlement-report/v1'),
  source: identity,
  collected_at: z.string().datetime({ offset: true }),
  samples: z.array(agentEconomicsSampleSchema).min(1).max(1_000),
}).strict().superRefine((report, context) => {
  const receipts = report.samples.map(sample => sample.receipt_sha256);
  if (new Set(receipts).size !== receipts.length)
    context.addIssue({
      code: 'custom',
      path: ['samples'],
      message: 'Receipt identities must be unique within a report',
    });
});

export type AgentEconomicsSample = {
  receiptSha256: string;
  source: string;
  observedAt: string;
  provider: string;
  model: string;
  reasoningEffort: string;
  harness: string;
  nodeId: string;
  inputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteInputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalRecordedTokens: number | null;
  requests: number | null;
  turns: number | null;
  agentSteps: number | null;
  fiveHourQuotaDeltaPercent: number | null;
  weeklyQuotaDeltaPercent: number | null;
  fiveHourResetsAt: string | null;
  weeklyResetsAt: string | null;
  acceptedOutcome: 'accepted' | 'rejected' | 'partial';
  verificationOutcome: 'passed' | 'failed' | 'not_run';
  wallTimeMs: number;
  retries: number;
  operatorInterventionMinutes: number | null;
  cleanupRework: 'none' | 'required';
  subscriptionMonthlyDollars: number | null;
};

export class AgentEconomicsReplayConflict extends Error {}

export async function saveAgentEconomicsReport(report: z.infer<typeof agentEconomicsEnvelopeSchema>) {
  await client.begin(async sql => {
    for (const sample of report.samples) {
      const rows = await sql<{ receipt_sha256: string }[]>`
        INSERT INTO agent_task_settlements (
          receipt_sha256, source, provider, harness, usage_sample_id,
          observed_at, accepted_outcome, verification_outcome, wall_time_ms,
          retries, operator_intervention_minutes, cleanup_rework,
          five_hour_quota_delta_percent, weekly_quota_delta_percent,
          five_hour_resets_at, weekly_resets_at,
          subscription_monthly_dollars, collected_at
        ) VALUES (
          ${sample.receipt_sha256}, ${report.source}, ${sample.provider},
          ${sample.harness}, ${sample.usage_sample_id}, ${sample.observed_at},
          ${sample.accepted_outcome}, ${sample.verification_outcome},
          ${sample.wall_time_ms}, ${sample.retries},
          ${sample.operator_intervention_minutes}, ${sample.cleanup_rework},
          ${sample.five_hour_quota_delta_percent},
          ${sample.weekly_quota_delta_percent}, ${sample.five_hour_resets_at},
          ${sample.weekly_resets_at}, ${sample.subscription_monthly_dollars},
          ${report.collected_at}
        )
        ON CONFLICT (receipt_sha256) DO UPDATE SET
          collected_at = GREATEST(agent_task_settlements.collected_at, EXCLUDED.collected_at)
        WHERE agent_task_settlements.source = EXCLUDED.source
          AND agent_task_settlements.provider = EXCLUDED.provider
          AND agent_task_settlements.harness = EXCLUDED.harness
          AND agent_task_settlements.usage_sample_id = EXCLUDED.usage_sample_id
          AND agent_task_settlements.observed_at = EXCLUDED.observed_at
          AND agent_task_settlements.accepted_outcome = EXCLUDED.accepted_outcome
          AND agent_task_settlements.verification_outcome = EXCLUDED.verification_outcome
          AND agent_task_settlements.wall_time_ms = EXCLUDED.wall_time_ms
          AND agent_task_settlements.retries = EXCLUDED.retries
          AND agent_task_settlements.operator_intervention_minutes IS NOT DISTINCT FROM EXCLUDED.operator_intervention_minutes
          AND agent_task_settlements.cleanup_rework = EXCLUDED.cleanup_rework
          AND agent_task_settlements.five_hour_quota_delta_percent IS NOT DISTINCT FROM EXCLUDED.five_hour_quota_delta_percent
          AND agent_task_settlements.weekly_quota_delta_percent IS NOT DISTINCT FROM EXCLUDED.weekly_quota_delta_percent
          AND agent_task_settlements.five_hour_resets_at IS NOT DISTINCT FROM EXCLUDED.five_hour_resets_at
          AND agent_task_settlements.weekly_resets_at IS NOT DISTINCT FROM EXCLUDED.weekly_resets_at
          AND agent_task_settlements.subscription_monthly_dollars IS NOT DISTINCT FROM EXCLUDED.subscription_monthly_dollars
        RETURNING receipt_sha256
      `;
      if (rows.length !== 1)
        throw new AgentEconomicsReplayConflict(`Changed replay for ${sample.receipt_sha256}`);
    }
    await sql`DELETE FROM agent_task_settlements WHERE observed_at < now() - interval '365 days'`;
  });
  return { samples: report.samples.length };
}

function nullableNumber(value: unknown): number | null {
  return value === null ? null : Number(value);
}

function nullableTime(value: unknown): string | null {
  return value === null ? null : new Date(value as string).toISOString();
}

export async function readAgentEconomicsSamples(days = 30): Promise<AgentEconomicsSample[]> {
  const boundedDays = Math.max(1, Math.min(365, Math.floor(days)));
  const rows = await client<Record<string, unknown>[]>`
    SELECT settlement.*, usage.model, usage.effort, usage.input_tokens,
      usage.cached_input_tokens, usage.cache_write_input_tokens,
      usage.output_tokens, usage.reasoning_tokens, usage.total_tokens,
      usage.request_count, usage.turn_count, usage.agent_step_count
    FROM agent_task_settlements settlement
    INNER JOIN agent_usage_samples usage
      ON usage.source = settlement.source
      AND usage.provider = settlement.provider
      AND usage.harness = settlement.harness
      AND usage.sample_id = settlement.usage_sample_id
    WHERE settlement.observed_at >= now() - (${boundedDays}::int * interval '1 day')
    ORDER BY settlement.observed_at ASC
  `;
  return rows.map(row => ({
    receiptSha256: String(row.receipt_sha256),
    source: String(row.source),
    observedAt: new Date(row.observed_at as string).toISOString(),
    provider: String(row.provider),
    model: String(row.model),
    reasoningEffort: row.effort === null ? 'unknown' : String(row.effort),
    harness: String(row.harness),
    nodeId: String(row.source),
    inputTokens: nullableNumber(row.input_tokens),
    cachedInputTokens: nullableNumber(row.cached_input_tokens),
    cacheWriteInputTokens: nullableNumber(row.cache_write_input_tokens),
    outputTokens: nullableNumber(row.output_tokens),
    reasoningTokens: nullableNumber(row.reasoning_tokens),
    totalRecordedTokens: nullableNumber(row.total_tokens),
    requests: nullableNumber(row.request_count),
    turns: nullableNumber(row.turn_count),
    agentSteps: nullableNumber(row.agent_step_count),
    fiveHourQuotaDeltaPercent: nullableNumber(row.five_hour_quota_delta_percent),
    weeklyQuotaDeltaPercent: nullableNumber(row.weekly_quota_delta_percent),
    fiveHourResetsAt: nullableTime(row.five_hour_resets_at),
    weeklyResetsAt: nullableTime(row.weekly_resets_at),
    acceptedOutcome: row.accepted_outcome as AgentEconomicsSample['acceptedOutcome'],
    verificationOutcome: row.verification_outcome as AgentEconomicsSample['verificationOutcome'],
    wallTimeMs: Number(row.wall_time_ms),
    retries: Number(row.retries),
    operatorInterventionMinutes: nullableNumber(row.operator_intervention_minutes),
    cleanupRework: row.cleanup_rework as AgentEconomicsSample['cleanupRework'],
    subscriptionMonthlyDollars: nullableNumber(row.subscription_monthly_dollars),
  }));
}
