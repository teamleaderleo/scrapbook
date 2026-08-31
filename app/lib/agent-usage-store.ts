import { client } from '@/app/lib/db/db';

import {
  agentTelemetryEnvelopeSchema,
  type AgentTelemetryEnvelope,
  type AgentUsageSample,
  type ProviderQuotaSample,
} from './agent-usage-contract';

export class AgentTelemetryReplayConflict extends Error {
  readonly sampleClass: 'usage' | 'quota';

  constructor(sampleClass: 'usage' | 'quota') {
    super(`${sampleClass} telemetry replay changed immutable sample facts`);
    this.name = 'AgentTelemetryReplayConflict';
    this.sampleClass = sampleClass;
  }
}

export async function saveAgentTelemetryReport(rawReport: AgentTelemetryEnvelope) {
  const report = agentTelemetryEnvelopeSchema.parse(rawReport);

  return client.begin(async sql => {
    async function saveUsageSample(
      sample: AgentUsageSample
    ): Promise<'inserted' | 'replayed'> {
      const inserted = await sql<{ inserted: number }[]>`
        INSERT INTO agent_usage_samples (
          source,
          sample_id,
          provider,
          harness,
          model,
          effort,
          accounting_contract,
          run_ref,
          observed_at,
          input_tokens,
          cached_input_tokens,
          cache_write_input_tokens,
          reasoning_tokens,
          output_tokens,
          total_tokens,
          request_count,
          turn_count,
          agent_step_count,
          collected_at
        ) VALUES (
          ${report.source},
          ${sample.sample_id},
          ${sample.provider},
          ${sample.harness},
          ${sample.model},
          ${sample.effort},
          ${sample.accounting_contract},
          ${sample.run_ref},
          ${sample.observed_at},
          ${sample.input_tokens},
          ${sample.cached_input_tokens},
          ${sample.cache_write_input_tokens},
          ${sample.reasoning_tokens},
          ${sample.output_tokens},
          ${sample.total_tokens},
          ${sample.request_count},
          ${sample.turn_count},
          ${sample.agent_step_count},
          ${report.collected_at}
        )
        ON CONFLICT (source, provider, harness, sample_id) DO NOTHING
        RETURNING 1 AS inserted
      `;
      if (inserted.length === 1) return 'inserted';

      const matches = await sql<{ matched: number }[]>`
        SELECT 1 AS matched
        FROM agent_usage_samples
        WHERE
          source = ${report.source} AND
          provider = ${sample.provider} AND
          harness = ${sample.harness} AND
          sample_id = ${sample.sample_id} AND
          model = ${sample.model} AND
          effort IS NOT DISTINCT FROM ${sample.effort} AND
          accounting_contract = ${sample.accounting_contract} AND
          run_ref IS NOT DISTINCT FROM ${sample.run_ref} AND
          observed_at = ${sample.observed_at} AND
          input_tokens IS NOT DISTINCT FROM ${sample.input_tokens} AND
          cached_input_tokens IS NOT DISTINCT FROM ${sample.cached_input_tokens} AND
          cache_write_input_tokens IS NOT DISTINCT FROM ${sample.cache_write_input_tokens} AND
          reasoning_tokens IS NOT DISTINCT FROM ${sample.reasoning_tokens} AND
          output_tokens IS NOT DISTINCT FROM ${sample.output_tokens} AND
          total_tokens IS NOT DISTINCT FROM ${sample.total_tokens} AND
          request_count IS NOT DISTINCT FROM ${sample.request_count} AND
          turn_count IS NOT DISTINCT FROM ${sample.turn_count} AND
          agent_step_count IS NOT DISTINCT FROM ${sample.agent_step_count}
      `;
      if (matches.length !== 1) throw new AgentTelemetryReplayConflict('usage');

      await sql`
        UPDATE agent_usage_samples
        SET collected_at = GREATEST(collected_at, ${report.collected_at})
        WHERE
          source = ${report.source} AND
          provider = ${sample.provider} AND
          harness = ${sample.harness} AND
          sample_id = ${sample.sample_id}
      `;
      return 'replayed';
    }

    async function saveQuotaSample(
      sample: ProviderQuotaSample
    ): Promise<'inserted' | 'replayed'> {
      const inserted = await sql<{ inserted: number }[]>`
        INSERT INTO provider_quota_samples (
          source,
          sample_id,
          provider,
          harness,
          model,
          plan_class,
          quota_contract,
          limit_id,
          window_minutes,
          percent_orientation,
          percent_value,
          resets_at,
          balance_unit,
          balance_value,
          observed_at,
          collected_at
        ) VALUES (
          ${report.source},
          ${sample.sample_id},
          ${sample.provider},
          ${sample.harness},
          ${sample.model},
          ${sample.plan_class},
          ${sample.quota_contract},
          ${sample.limit_id},
          ${sample.window_minutes},
          ${sample.percent_orientation},
          ${sample.percent_value},
          ${sample.resets_at},
          ${sample.balance_unit},
          ${sample.balance_value},
          ${sample.observed_at},
          ${report.collected_at}
        )
        ON CONFLICT (source, provider, harness, sample_id, limit_id) DO NOTHING
        RETURNING 1 AS inserted
      `;
      if (inserted.length === 1) return 'inserted';

      const matches = await sql<{ matched: number }[]>`
        SELECT 1 AS matched
        FROM provider_quota_samples
        WHERE
          source = ${report.source} AND
          provider = ${sample.provider} AND
          harness = ${sample.harness} AND
          sample_id = ${sample.sample_id} AND
          limit_id = ${sample.limit_id} AND
          model IS NOT DISTINCT FROM ${sample.model} AND
          plan_class IS NOT DISTINCT FROM ${sample.plan_class} AND
          quota_contract = ${sample.quota_contract} AND
          window_minutes IS NOT DISTINCT FROM ${sample.window_minutes} AND
          percent_orientation IS NOT DISTINCT FROM ${sample.percent_orientation} AND
          percent_value IS NOT DISTINCT FROM ${sample.percent_value} AND
          resets_at IS NOT DISTINCT FROM ${sample.resets_at} AND
          balance_unit IS NOT DISTINCT FROM ${sample.balance_unit} AND
          balance_value IS NOT DISTINCT FROM ${sample.balance_value} AND
          observed_at = ${sample.observed_at}
      `;
      if (matches.length !== 1) throw new AgentTelemetryReplayConflict('quota');

      await sql`
        UPDATE provider_quota_samples
        SET collected_at = GREATEST(collected_at, ${report.collected_at})
        WHERE
          source = ${report.source} AND
          provider = ${sample.provider} AND
          harness = ${sample.harness} AND
          sample_id = ${sample.sample_id} AND
          limit_id = ${sample.limit_id}
      `;
      return 'replayed';
    }

    let usageInserted = 0;
    let usageReplayed = 0;
    let quotaInserted = 0;
    let quotaReplayed = 0;

    for (const sample of report.usage_samples) {
      const outcome = await saveUsageSample(sample);
      if (outcome === 'inserted') usageInserted += 1;
      else usageReplayed += 1;
    }

    for (const sample of report.quota_samples) {
      const outcome = await saveQuotaSample(sample);
      if (outcome === 'inserted') quotaInserted += 1;
      else quotaReplayed += 1;
    }

    await sql`
      DELETE FROM agent_usage_samples
      WHERE observed_at < now() - interval '365 days'
    `;
    await sql`
      DELETE FROM provider_quota_samples
      WHERE observed_at < now() - interval '365 days'
    `;

    return {
      source: report.source,
      collectedAt: report.collected_at,
      usageInserted,
      usageReplayed,
      quotaInserted,
      quotaReplayed,
    };
  });
}
