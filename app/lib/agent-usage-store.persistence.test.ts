import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  begin: vi.fn(),
  queries: [] as string[],
  insertResults: [] as { inserted: number }[][],
  matchResults: [] as { matched: number }[][],
}));

vi.mock('@/app/lib/db/db', () => ({
  client: { begin: database.begin },
}));

import { agentTelemetryEnvelopeSchema } from './agent-usage-contract';
import {
  AgentTelemetryReplayConflict,
  saveAgentTelemetryReport,
} from './agent-usage-store';

function installDatabaseDouble() {
  function sql(first: unknown, ...values: unknown[]): unknown {
    if (
      Array.isArray(first) &&
      Object.prototype.hasOwnProperty.call(first, 'raw')
    ) {
      const strings = first as string[];
      const query = strings
        .map(
          (part, index) => `${part}${index < values.length ? '[value]' : ''}`
        )
        .join('');
      database.queries.push(query);
      if (query.includes('RETURNING 1 AS inserted'))
        return Promise.resolve(database.insertResults.shift() ?? [{ inserted: 1 }]);
      if (query.includes('SELECT 1 AS matched'))
        return Promise.resolve(database.matchResults.shift() ?? [{ matched: 1 }]);
      return Promise.resolve([]);
    }
    return { kind: 'bulk-values' };
  }

  database.begin.mockImplementation(
    async (callback: (tag: typeof sql) => Promise<unknown>) => callback(sql)
  );
}

function report() {
  return agentTelemetryEnvelopeSchema.parse({
    schema: 'agent-telemetry-report/v1',
    source: 'big-red',
    collected_at: '2026-08-31T19:01:00.000Z',
    usage_samples: [
      {
        schema: 'agent-usage-sample/v1',
        sample_id: 'attempt-1',
        observed_at: '2026-08-31T19:00:00.000Z',
        provider: 'google',
        harness: 'antigravity',
        model: 'gemini-3.7-flash-high',
        effort: 'high',
        accounting_contract: 'antigravity-headless-usage-delta/v1',
        run_ref: 'stensibly:run_abc123',
        input_tokens: 10_415,
        cached_input_tokens: 8_113,
        cache_write_input_tokens: null,
        reasoning_tokens: 616,
        output_tokens: 657,
        total_tokens: 11_072,
        request_count: null,
        successful_request_count: null,
        api_equivalent_estimate_usd: null,
        turn_count: 1,
        agent_step_count: null,
      },
    ],
    quota_samples: [
      {
        schema: 'provider-quota-sample/v1',
        sample_id: 'attempt-1-after',
        observed_at: '2026-08-31T19:00:30.000Z',
        provider: 'google',
        harness: 'antigravity',
        model: 'gemini-3.7-flash-high',
        plan_class: 'google-ai-pro',
        quota_contract: 'antigravity-statusline-quota/v1',
        limit_id: 'gemini-weekly',
        window_minutes: null,
        percent_orientation: 'remaining',
        percent_value: 98,
        resets_at: '2026-09-06T12:00:00.000Z',
        balance_unit: null,
        balance_value: null,
      },
    ],
  });
}

describe('provider-neutral telemetry persistence', () => {
  beforeEach(() => {
    database.queries.length = 0;
    database.insertResults = [];
    database.matchResults = [];
    database.begin.mockReset();
    installDatabaseDouble();
  });

  it('inserts new usage and quota samples under provider-scoped keys', async () => {
    await expect(saveAgentTelemetryReport(report())).resolves.toMatchObject({
      usageInserted: 1,
      usageReplayed: 0,
      quotaInserted: 1,
      quotaReplayed: 0,
    });

    const conflictClauses = database.queries.filter(query =>
      query.includes('ON CONFLICT')
    );
    expect(conflictClauses).toHaveLength(2);
    expect(conflictClauses[0]).toContain(
      'ON CONFLICT (source, provider, harness, sample_id) DO NOTHING'
    );
    expect(conflictClauses[1]).toContain(
      'ON CONFLICT (source, provider, harness, sample_id, limit_id) DO NOTHING'
    );
  });

  it('accepts exact replay only after a null-safe semantic readback', async () => {
    database.insertResults = [[], []];
    database.matchResults = [[{ matched: 1 }], [{ matched: 1 }]];

    await expect(saveAgentTelemetryReport(report())).resolves.toMatchObject({
      usageInserted: 0,
      usageReplayed: 1,
      quotaInserted: 0,
      quotaReplayed: 1,
    });

    const semanticReads = database.queries.filter(query =>
      query.includes('SELECT 1 AS matched')
    );
    expect(semanticReads).toHaveLength(2);
    for (const query of semanticReads)
      expect(query).toContain('IS NOT DISTINCT FROM');

    const replayRefreshes = database.queries.filter(query =>
      query.includes('SET collected_at = GREATEST')
    );
    expect(replayRefreshes).toHaveLength(2);
  });

  it('rejects a changed replay instead of overwriting immutable facts', async () => {
    database.insertResults = [[]];
    database.matchResults = [[]];

    await expect(saveAgentTelemetryReport(report())).rejects.toBeInstanceOf(
      AgentTelemetryReplayConflict
    );
    expect(
      database.queries.some(query => query.includes('provider_quota_samples'))
    ).toBe(false);
  });

  it('keeps a bounded year of provider usage and quota history', async () => {
    await saveAgentTelemetryReport(report());

    const retentionDeletes = database.queries.filter(query =>
      query.includes('DELETE FROM')
    );
    expect(retentionDeletes).toHaveLength(2);
    for (const query of retentionDeletes)
      expect(query).toContain("interval '365 days'");
  });
});
