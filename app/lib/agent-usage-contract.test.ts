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
  it('accepts current Gemini headless usage and a multi-bucket quota snapshot', () => {
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
          accounting_contract: 'antigravity-headless-usage/v1',
          run_ref: 'stensibly:run_abc123',
          input_tokens: 10_415,
          cached_input_tokens: 8_113,
          cache_write_input_tokens: null,
          reasoning_tokens: 616,
          output_tokens: 657,
          total_tokens: 11_072,
          request_count: null,
          turn_count: 1,
          agent_step_count: null,
        },
      ],
      quota_samples: [
        quota('agy-task-1-after', 'gemini-5h', 99, '2026-08-31T23:00:00Z', 300),
        quota('agy-task-1-after', 'gemini-weekly', 98, '2026-09-06T12:00:00Z', 10_080),
      ],
    });

    expect(parsed.usage_samples[0]).toMatchObject({
      provider: 'google',
      harness: 'antigravity',
      input_tokens: 10_415,
      cached_input_tokens: 8_113,
      reasoning_tokens: 616,
      output_tokens: 657,
      total_tokens: 11_072,
      turn_count: 1,
    });
    expect(parsed.quota_samples).toHaveLength(2);
    expect(parsed.quota_samples[1]).toMatchObject({
      model: 'gemini-3.7-flash-high',
      limit_id: 'gemini-weekly',
      percent_orientation: 'remaining',
      percent_value: 98,
    });
  });

  it('namespaces local sample IDs by provider and harness', () => {
    const result = agentTelemetryEnvelopeSchema.safeParse({
      ...baseReport(),
      usage_samples: [
        usage('attempt-1'),
        {
          ...usage('attempt-1'),
          provider: 'google',
          harness: 'antigravity',
          model: 'gemini-3.7-flash-high',
          effort: 'high',
          accounting_contract: 'antigravity-headless-usage/v1',
        },
      ],
    });

    expect(result.success).toBe(true);
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
          ...quota('bad-percent', 'gemini-weekly', 98, null, 10_080),
          percent_value: null,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects reset-only quota noise and duplicate sample keys', () => {
    const resetOnly = agentTelemetryEnvelopeSchema.safeParse({
      ...baseReport(),
      quota_samples: [
        {
          ...quota('reset-only', 'gemini-weekly', 98, '2026-09-06T12:00:00Z', 10_080),
          percent_orientation: null,
          percent_value: null,
        },
      ],
    });
    expect(resetOnly.success).toBe(false);

    const duplicateUsage = agentTelemetryEnvelopeSchema.safeParse({
      ...baseReport(),
      usage_samples: [usage('same-id'), usage('same-id')],
    });
    expect(duplicateUsage.success).toBe(false);

    const duplicateQuota = agentTelemetryEnvelopeSchema.safeParse({
      ...baseReport(),
      quota_samples: [
        quota('same-snapshot', 'gemini-weekly', 98, null, 10_080),
        quota('same-snapshot', 'gemini-weekly', 97, null, 10_080),
      ],
    });
    expect(duplicateQuota.success).toBe(false);
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

function quota(
  sampleId: string,
  limitId: string,
  remainingPercent: number,
  resetsAt: string | null,
  windowMinutes: number
) {
  return {
    schema: 'provider-quota-sample/v1' as const,
    sample_id: sampleId,
    observed_at: '2026-08-31T18:29:30Z',
    provider: 'google',
    harness: 'antigravity',
    model: 'gemini-3.7-flash-high',
    plan_class: 'google-ai-pro',
    quota_contract: 'antigravity-statusline-quota/v1',
    limit_id: limitId,
    window_minutes: windowMinutes,
    percent_orientation: 'remaining' as const,
    percent_value: remainingPercent,
    resets_at: resetsAt,
    balance_unit: null,
    balance_value: null,
  };
}
