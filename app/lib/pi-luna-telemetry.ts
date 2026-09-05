import { z } from 'zod';

import {
  agentUsageSampleSchema,
  type AgentUsageSample,
} from './agent-usage-contract';

const safeCounterSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);

const piUsageSchema = z
  .object({
    input: safeCounterSchema.optional(),
    cacheRead: safeCounterSchema.optional(),
    output: safeCounterSchema.optional(),
    reasoning: safeCounterSchema.optional(),
    totalTokens: safeCounterSchema.optional(),
  })
  .superRefine((usage, context) => {
    if (Object.values(usage).every(value => value === undefined)) {
      context.addIssue({
        code: 'custom',
        message: 'Pi usage must contain at least one recognized counter',
      });
    }
  });

const piLunaReceiptSchema = z.object({
  schemaVersion: z.literal('pi-luna-worker-receipt/1'),
  pi: z.object({
    provider: z.literal('openai-codex'),
    model: z.literal('gpt-5.6-luna'),
    reasoningEffort: z.string().trim().min(1).max(128),
  }),
  usage: piUsageSchema.nullable(),
});

export type PiLunaUsageProjectionContext = {
  sampleId: string;
  observedAt: string;
  runRef: string | null;
};

export function projectPiLunaReceiptUsage(
  value: unknown,
  context: PiLunaUsageProjectionContext
): AgentUsageSample | null {
  const receipt = piLunaReceiptSchema.parse(value);
  if (receipt.usage === null) return null;

  return agentUsageSampleSchema.parse({
    schema: 'agent-usage-sample/v1',
    sample_id: context.sampleId,
    observed_at: context.observedAt,
    provider: 'openai',
    harness: 'pi',
    model: receipt.pi.model,
    effort: receipt.pi.reasoningEffort,
    accounting_contract: 'pi-luna-provider-usage/v1',
    run_ref: context.runRef,
    input_tokens: receipt.usage.input ?? null,
    cached_input_tokens: receipt.usage.cacheRead ?? null,
    cache_write_input_tokens: null,
    reasoning_tokens: receipt.usage.reasoning ?? null,
    output_tokens: receipt.usage.output ?? null,
    total_tokens: receipt.usage.totalTokens ?? null,
    request_count: null,
    successful_request_count: null,
    api_equivalent_estimate_usd: null,
    turn_count: null,
    agent_step_count: null,
  });
}
