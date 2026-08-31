import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  begin: vi.fn(),
  queries: [] as string[],
  insertResults: [] as { receipt_sha256: string }[][],
}));

vi.mock('@/app/lib/db/db', () => ({
  client: { begin: database.begin },
}));

import {
  AgentEconomicsReplayConflict,
  agentEconomicsEnvelopeSchema,
  saveAgentEconomicsReport,
} from './agent-economics-store';

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
      if (query.includes('RETURNING receipt_sha256'))
        return Promise.resolve(
          database.insertResults.shift() ?? [
            { receipt_sha256: `sha256:${'a'.repeat(64)}` },
          ]
        );
      return Promise.resolve([]);
    }
    return { kind: 'bulk-values' };
  }

  database.begin.mockImplementation(
    async (callback: (tag: typeof sql) => Promise<unknown>) => callback(sql)
  );
}

function report() {
  return agentEconomicsEnvelopeSchema.parse({
    schema: 'agent-task-settlement-report/v1',
    source: 'big-red',
    collected_at: '2026-09-01T01:05:00Z',
    samples: [
      {
        receipt_sha256: `sha256:${'a'.repeat(64)}`,
        usage_sample_id: 'attempt-1',
        observed_at: '2026-09-01T01:00:00Z',
        provider: 'google',
        harness: 'antigravity',
        accepted_outcome: 'accepted',
        verification_outcome: 'passed',
        wall_time_ms: 45_000,
        retries: 1,
        operator_intervention_minutes: 2.5,
        cleanup_rework: 'none',
        five_hour_quota_delta_percent: 0.7,
        weekly_quota_delta_percent: 0.2,
        five_hour_resets_at: '2026-09-01T05:00:00Z',
        weekly_resets_at: '2026-09-07T00:00:00Z',
        subscription_monthly_dollars: 19.99,
      },
    ],
  });
}

describe('agent economics persistence', () => {
  beforeEach(() => {
    database.queries.length = 0;
    database.insertResults = [];
    database.begin.mockReset();
    installDatabaseDouble();
  });

  it('stores a new settlement and retains only a bounded year', async () => {
    await expect(saveAgentEconomicsReport(report())).resolves.toEqual({
      samples: 1,
    });

    const insert = database.queries.find(query =>
      query.includes('INSERT INTO agent_task_settlements')
    );
    expect(insert).toContain('ON CONFLICT (receipt_sha256) DO UPDATE SET');
    expect(insert).toContain(
      'collected_at = GREATEST(agent_task_settlements.collected_at, EXCLUDED.collected_at)'
    );

    const retention = database.queries.find(query =>
      query.includes('DELETE FROM agent_task_settlements')
    );
    expect(retention).toContain("interval '365 days'");
  });

  it('accepts replay only when every immutable settlement fact matches', async () => {
    await saveAgentEconomicsReport(report());

    const insert = database.queries.find(query =>
      query.includes('INSERT INTO agent_task_settlements')
    );
    expect(insert).toContain(
      'operator_intervention_minutes IS NOT DISTINCT FROM EXCLUDED.operator_intervention_minutes'
    );
    expect(insert).toContain(
      'five_hour_quota_delta_percent IS NOT DISTINCT FROM EXCLUDED.five_hour_quota_delta_percent'
    );
    expect(insert).toContain(
      'weekly_quota_delta_percent IS NOT DISTINCT FROM EXCLUDED.weekly_quota_delta_percent'
    );
    expect(insert).toContain(
      'subscription_monthly_dollars IS NOT DISTINCT FROM EXCLUDED.subscription_monthly_dollars'
    );
    expect(insert).toContain(
      'accepted_outcome = EXCLUDED.accepted_outcome'
    );
    expect(insert).toContain(
      'verification_outcome = EXCLUDED.verification_outcome'
    );
  });

  it('rejects a changed replay instead of overwriting the receipt identity', async () => {
    database.insertResults = [[]];

    await expect(saveAgentEconomicsReport(report())).rejects.toBeInstanceOf(
      AgentEconomicsReplayConflict
    );
    expect(
      database.queries.some(query =>
        query.includes('DELETE FROM agent_task_settlements')
      )
    ).toBe(false);
  });
});
