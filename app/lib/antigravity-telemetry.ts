import { z } from 'zod';

import {
  agentUsageSampleSchema,
  providerQuotaSampleSchema,
  type AgentUsageSample,
  type ProviderQuotaSample,
} from './agent-usage-contract';

const safeCounterSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);

const antigravityUsageSchema = z.object({
  input_tokens: safeCounterSchema,
  output_tokens: safeCounterSchema,
  thinking_tokens: safeCounterSchema,
  cache_read_tokens: safeCounterSchema,
  total_tokens: safeCounterSchema,
});

const antigravityHeadlessResultSchema = z.object({
  status: z.enum([
    'SUCCESS',
    'ERROR',
    'CANCELED',
    'INTERRUPTED',
    'INVALID',
    'WAITING',
    'RUNNING',
  ]),
  num_turns: safeCounterSchema,
  usage: antigravityUsageSchema,
});

const antigravityQuotaEntrySchema = z.object({
  remaining_fraction: z.number().finite().min(0).max(1),
  reset_time: z.string().datetime({ offset: true }).nullable().optional(),
  reset_in_seconds: safeCounterSchema.optional(),
});

const antigravityStatusLineSchema = z.object({
  product: z.literal('antigravity'),
  quota: z.record(antigravityQuotaEntrySchema).optional(),
  plan_tier: z.string().trim().min(1).max(64).optional(),
});

export type AntigravityCumulativeUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
  outputTokens: number;
  totalTokens: number;
  turns: number;
};

export type AntigravityUsageProjectionContext = {
  sampleId: string;
  observedAt: string;
  model: string;
  effort: string | null;
  runRef: string | null;
  sessionMode: 'fresh' | 'resumed';
  baseline?: AntigravityCumulativeUsage;
};

export type AntigravityQuotaProjectionContext = {
  sampleId: string;
  observedAt: string;
  model: string;
  planClass?: string | null;
};

function cumulativeUsage(parsed: z.infer<typeof antigravityHeadlessResultSchema>) {
  return {
    inputTokens: parsed.usage.input_tokens,
    cachedInputTokens: parsed.usage.cache_read_tokens,
    reasoningTokens: parsed.usage.thinking_tokens,
    outputTokens: parsed.usage.output_tokens,
    totalTokens: parsed.usage.total_tokens,
    turns: parsed.num_turns,
  } satisfies AntigravityCumulativeUsage;
}

export function parseAntigravityCumulativeUsage(
  value: unknown
): AntigravityCumulativeUsage {
  return cumulativeUsage(antigravityHeadlessResultSchema.parse(value));
}

function subtractCounter(
  current: number,
  baseline: number,
  field: string
): number {
  if (current < baseline)
    throw new Error(`Antigravity cumulative ${field} regressed`);
  return current - baseline;
}

function usageDelta(
  current: AntigravityCumulativeUsage,
  context: AntigravityUsageProjectionContext
): AntigravityCumulativeUsage {
  if (context.sessionMode === 'fresh') {
    if (context.baseline !== undefined)
      throw new Error('Fresh Antigravity sessions must not provide a baseline');
    return current;
  }

  if (context.baseline === undefined)
    throw new Error('Resumed Antigravity sessions require a cumulative baseline');

  return {
    inputTokens: subtractCounter(
      current.inputTokens,
      context.baseline.inputTokens,
      'input_tokens'
    ),
    cachedInputTokens: subtractCounter(
      current.cachedInputTokens,
      context.baseline.cachedInputTokens,
      'cache_read_tokens'
    ),
    reasoningTokens: subtractCounter(
      current.reasoningTokens,
      context.baseline.reasoningTokens,
      'thinking_tokens'
    ),
    outputTokens: subtractCounter(
      current.outputTokens,
      context.baseline.outputTokens,
      'output_tokens'
    ),
    totalTokens: subtractCounter(
      current.totalTokens,
      context.baseline.totalTokens,
      'total_tokens'
    ),
    turns: subtractCounter(current.turns, context.baseline.turns, 'num_turns'),
  };
}

export function projectAntigravityHeadlessUsage(
  value: unknown,
  context: AntigravityUsageProjectionContext
): AgentUsageSample {
  const current = parseAntigravityCumulativeUsage(value);
  const delta = usageDelta(current, context);

  return agentUsageSampleSchema.parse({
    schema: 'agent-usage-sample/v1',
    sample_id: context.sampleId,
    observed_at: context.observedAt,
    provider: 'google',
    harness: 'antigravity',
    model: context.model,
    effort: context.effort,
    accounting_contract: 'antigravity-headless-usage-delta/v1',
    run_ref: context.runRef,
    input_tokens: delta.inputTokens,
    cached_input_tokens: delta.cachedInputTokens,
    cache_write_input_tokens: null,
    reasoning_tokens: delta.reasoningTokens,
    output_tokens: delta.outputTokens,
    total_tokens: delta.totalTokens,
    request_count: null,
    turn_count: delta.turns,
    agent_step_count: null,
  });
}

function normalizePlanTier(value: string | undefined): string | null {
  if (value === undefined) return null;
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length === 0) return null;
  return slug.startsWith('google-ai-') ? slug : `google-ai-${slug}`;
}

export function projectAntigravityStatusLineQuota(
  value: unknown,
  context: AntigravityQuotaProjectionContext
): ProviderQuotaSample[] {
  const parsed = antigravityStatusLineSchema.parse(value);
  const planClass = context.planClass ?? normalizePlanTier(parsed.plan_tier);
  const quotaEntries = Object.entries(parsed.quota ?? {});
  if (quotaEntries.length > 128)
    throw new Error('Antigravity status-line quota map exceeds the supported bound');

  return quotaEntries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([limitId, quota]) =>
      providerQuotaSampleSchema.parse({
        schema: 'provider-quota-sample/v1',
        sample_id: context.sampleId,
        observed_at: context.observedAt,
        provider: 'google',
        harness: 'antigravity',
        model: context.model,
        plan_class: planClass,
        quota_contract: 'antigravity-statusline-quota/v1',
        limit_id: limitId,
        window_minutes: null,
        percent_orientation: 'remaining',
        percent_value: quota.remaining_fraction * 100,
        resets_at: quota.reset_time ?? null,
        balance_unit: null,
        balance_value: null,
      })
    );
}
