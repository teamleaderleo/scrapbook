import { z } from 'zod';

const compactIdentitySchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.:/@#+=\-]*$/);

const boundedReferenceSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.:/@#+=\-]*$/);

const nullableCounterSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
  .nullable();

type SampleIdentity = {
  sample_id: string;
  provider: string;
  harness: string;
};

function hasDuplicateSampleKeys(samples: ReadonlyArray<SampleIdentity>) {
  const keys = samples.map(
    sample => `${sample.provider}\u0000${sample.harness}\u0000${sample.sample_id}`
  );
  return new Set(keys).size !== keys.length;
}

export const agentUsageSampleSchema = z
  .object({
    schema: z.literal('agent-usage-sample/v1'),
    sample_id: compactIdentitySchema,
    observed_at: z.string().datetime({ offset: true }),
    provider: compactIdentitySchema,
    harness: compactIdentitySchema,
    model: compactIdentitySchema,
    effort: compactIdentitySchema.nullable(),
    accounting_contract: compactIdentitySchema,
    run_ref: boundedReferenceSchema.nullable(),
    input_tokens: nullableCounterSchema,
    cached_input_tokens: nullableCounterSchema,
    cache_write_input_tokens: nullableCounterSchema,
    reasoning_tokens: nullableCounterSchema,
    output_tokens: nullableCounterSchema,
    total_tokens: nullableCounterSchema,
    request_count: nullableCounterSchema,
    turn_count: nullableCounterSchema,
    agent_step_count: nullableCounterSchema,
  })
  .strict();

export const providerQuotaSampleSchema = z
  .object({
    schema: z.literal('provider-quota-sample/v1'),
    sample_id: compactIdentitySchema,
    observed_at: z.string().datetime({ offset: true }),
    provider: compactIdentitySchema,
    harness: compactIdentitySchema,
    model: compactIdentitySchema.nullable(),
    plan_class: compactIdentitySchema.nullable(),
    quota_contract: compactIdentitySchema,
    limit_id: compactIdentitySchema,
    window_minutes: z.number().int().min(1).max(525_600).nullable(),
    percent_orientation: z.enum(['used', 'remaining']).nullable(),
    percent_value: z.number().finite().min(0).max(100).nullable(),
    resets_at: z.string().datetime({ offset: true }).nullable(),
    balance_unit: compactIdentitySchema.nullable(),
    balance_value: z.number().finite().nonnegative().nullable(),
  })
  .strict()
  .superRefine((sample, context) => {
    if ((sample.percent_orientation === null) !== (sample.percent_value === null)) {
      context.addIssue({
        code: 'custom',
        path: ['percent_value'],
        message: 'Quota percentage orientation and value must be present together',
      });
    }

    if ((sample.balance_unit === null) !== (sample.balance_value === null)) {
      context.addIssue({
        code: 'custom',
        path: ['balance_value'],
        message: 'Quota balance unit and value must be present together',
      });
    }

    if (sample.percent_value === null && sample.balance_value === null) {
      context.addIssue({
        code: 'custom',
        message: 'Quota samples must contain a percentage or typed balance',
      });
    }
  });

export const agentTelemetryEnvelopeSchema = z
  .object({
    schema: z.literal('agent-telemetry-report/v1'),
    source: compactIdentitySchema,
    collected_at: z.string().datetime({ offset: true }),
    usage_samples: z.array(agentUsageSampleSchema).max(4_096),
    quota_samples: z.array(providerQuotaSampleSchema).max(4_096),
  })
  .strict()
  .superRefine((report, context) => {
    if (hasDuplicateSampleKeys(report.usage_samples)) {
      context.addIssue({
        code: 'custom',
        path: ['usage_samples'],
        message: 'Usage sample keys must be unique within a report',
      });
    }
    if (hasDuplicateSampleKeys(report.quota_samples)) {
      context.addIssue({
        code: 'custom',
        path: ['quota_samples'],
        message: 'Quota sample keys must be unique within a report',
      });
    }
  });

export type AgentUsageSample = z.infer<typeof agentUsageSampleSchema>;
export type ProviderQuotaSample = z.infer<typeof providerQuotaSampleSchema>;
export type AgentTelemetryEnvelope = z.infer<typeof agentTelemetryEnvelopeSchema>;
