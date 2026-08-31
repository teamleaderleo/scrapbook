import { describe, expect, it } from 'vitest';
import { agentTelemetryEnvelopeSchema } from './agent-usage-contract';

function baseReport() {
  return {
    schema: 'agent-telemetry-report/v1' as const,
    source: 'big-red',
    collected_at: '2026-08-31T18:30:00Z',
    usage_samples: [],
    quota_samples: [],
  };
}

describe('agentTelemetryEnvelopeSchema', () => {
  it('accepts Gemini quota evidence while preserving unknown token counters', () => {
    const parsed = agentTelemetryEnvelopeSchema.parse({
      ...baseReport(),
      usage_samples: [
        {
          schema: 'agent-usage-sample/v1',
          sample_id: 'agy-task-1',
          observed_at: '2026-08-31T18:29:00Z',
          provider: 'google',
          harness: 'antigravity',
          model: 'gemini-3.7-flash-high',
          effort: 'high',
          accounting_contract: 'antigravity-usage/v1',
          run_ref: 'stensibly:run_abc123',
          input_tokens: null,
          cached_input_tokens: null,
          cache_write_input_tokens: null,
          reasoning_tokens: null,
          output_tokens: null,
          total_tokens: null,
          request_count: null,
          turn_count: null,
          agent_step_count: null,
        },
      ],
      quota_samples: [
        {
          schema: 'provider-quota-sample/v1',
          sample_id: 'agy-task-1-weekly-after',
          observed_at: '2026-08-31T18:29:30Z',
          provider: 'google',
          harness: 'antigravity',
          plan_class: 'google-ai-pro',
          quota_contract: 'antigravity-quota/v1',
          limit_id: 'weekly',
          window_minutes: 10_080,
          percent_orientation: 'remaining',
          percent_value: 98,
          resets_at: '2026-09-06T12:00:00Z',
          balance_unit: null,
          balance_value: null,
        },
      ],
    });

    expect(parsed.usage_samples[0]).toMatchObject({
      provider: 'google',
      harness: 'antigravity',
      total_tokens: null,
    });
    expect(parsed.quota_samples[0]).toMatchObject({
      percent_orientation: 'remaining',
      percent_value: 98,
    });
  });

  it('does not impose OpenAI token-membership arithmetic on other providers', () => {
    const result = agentTelemetryEnvelopeSchema.safeParse({
      ...baseReport(),
      usage_samples: [
        {
          schema: 'agent-usage-sample/v1',
          sample_id: 'dialect-control',
          observed_at: '2026-08-31T18:29:00Z',
          provider: 'example',
          harness: 'provider-native',
          model: 'example-model',
          effort: null,
          accounting_contract: 'example-additive-reasoning/v1',
          run_ref: null,
          input_tokens: 100,
          cached_input_tokens: 150,
          cache_write_input_tokens: 175,
          reasoning_tokens: 30,
          output_tokens: 20,
          total_tokens: null,
          request_count: 1,
          turn_count: null,
          agent_step_count: null,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('requires quota percentage orientation and value together', () => {
    const result = agentTelemetryEnvelopeSchema.safeParse({
      ...baseReport(),
      quota_samples: [
        {
          schema: 'provider-quota-sample/v1',
          sample_id: 'bad-percent',
          observed_at: '2026-08-31T18:29:00Z',
          provider: 'google',
          harness: 'antigravity',
          plan_class: 'google-ai-pro',
          quota_contract: 'antigravity-quota/v1',
          limit_id: 'weekly',
          window_minutes: 10_080,
          percent_orientation: 'remaining',
          percent_value: null,
          resets_at: null,
          balance_unit: null,
          balance_value: null,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects reset-only quota noise and duplicate sample identities', () => {
    const resetOnly = agentTelemetryEnvelopeSchema.safeParse({
      ...baseReport(),
      quota_samples: [
        {
          schema: 'provider-quota-sample/v1',
          sample_id: 'reset-only',
          observed_at: '2026-08-31T18:29:00Z',
          provider: 'google',
          harness: 'antigravity',
          plan_class: 'google-ai-pro',
          quota_contract: 'antigravity-quota/v1',
          limit_id: 'weekly',
          window_minutes: 10_080,
          percent_orientation: null,
          percent_value: null,
          resets_at: '2026-09-06T12:00:00Z',
          balance_unit: null,
          balance_value: null,
        },
      ],
    });
    expect(resetOnly.success).toBe(false);

    const duplicate = agentTelemetryEnvelopeSchema.safeParse({
      ...baseReport(),
      usage_samples: [usage('same-id'), usage('same-id')],
    });
    expect(duplicate.success).toBe(false);
  });

  it('rejects undeclared private-content fields', () => {
    const sample = { ...usage('closed-schema'), prompt_text: 'do not retain me' };
    const result = agentTelemetryEnvelopeSchema.safeParse({
      ...baseReport(),
      usage_samples: [sample],
    });

    expect(result.success).toBe(false);
  });
});

function usage(sampleId: string) {
  return {
    schema: 'agent-usage-sample/v1' as const,
    sample_id: sampleId,
    observed_at: '2026-08-31T18:29:00Z',
    provider: 'openai',
    harness: 'pi',
    model: 'gpt-5.6-luna',
    effort: 'max',
    accounting_contract: 'pi-provider-usage/v1',
    run_ref: null,
    input_tokens: 100,
    cached_input_tokens: 80,
    cache_write_input_tokens: null,
    reasoning_tokens: null,
    output_tokens: 20,
    total_tokens: 120,
    request_count: 1,
    turn_count: null,
    agent_step_count: null,
  };
}
