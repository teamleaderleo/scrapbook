import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  begin: vi.fn(),
  queries: [] as string[],
  returnedRows: [] as { accounting_state: string }[],
}));

vi.mock('@/app/lib/db/db', () => ({
  client: { begin: database.begin },
}));

import {
  codexTokenReportSchema,
  saveCodexTokenReport,
  saveMachineHealth,
} from './machine-health-store';
import { healthyMachineReport } from '@/tests/fixtures/machine-health';

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
      if (query.includes('RETURNING accounting_state'))
        return Promise.resolve(database.returnedRows);
      return Promise.resolve([]);
    }
    return { kind: 'bulk-values' };
  }
  Object.assign(sql, {
    json: (value: unknown) => value,
    array: (values: unknown[]) => values,
  });
  database.begin.mockImplementation(
    async (callback: (tag: typeof sql) => Promise<unknown>) => callback(sql)
  );
}

function report() {
  return codexTokenReportSchema.parse({
    schema_version: 1,
    source: 'macbook-air',
    collected_at: '2026-08-29T06:05:00.000Z',
    windows: [
      {
        source: 'session-jsonl',
        window_started_at: '2026-08-29T05:00:00.000Z',
        window_ended_at: '2026-08-29T06:00:00.000Z',
        input_tokens: 1_000,
        cached_input_tokens: 800,
        cache_write_input_tokens: 100,
        output_tokens: 50,
        reasoning_output_tokens: 20,
        total_tokens: 1_050,
        model_calls: 4,
        active_routes: 2,
        session_fingerprints: ['0123456789abcdef0123456789abcdef'],
        fingerprints_complete: true,
      },
    ],
  });
}

describe('Codex token persistence ordering', () => {
  beforeEach(() => {
    database.queries.length = 0;
    database.returnedRows = [{ accounting_state: 'counted' }];
    database.begin.mockReset();
    installDatabaseDouble();
  });

  it('guards both token upserts against an older collection timestamp', async () => {
    await saveCodexTokenReport(report());
    await saveMachineHealth(healthyMachineReport);

    const tokenUpserts = database.queries.filter(query =>
      query.includes('ON CONFLICT (source, window_started_at)')
    );
    expect(tokenUpserts).toHaveLength(2);
    for (const query of tokenUpserts)
      expect(query).toContain(
        'WHERE codex_token_samples.collected_at <= EXCLUDED.collected_at'
      );
  });

  it('reports rows rejected by the timestamp guard as ignored', async () => {
    database.returnedRows = [];

    await expect(saveCodexTokenReport(report())).resolves.toMatchObject({
      windows: 1,
      counted: 0,
      skipped: 0,
      ignored: 1,
    });
  });

  it('derives counted and skipped coverage from rows actually written', async () => {
    database.returnedRows = [{ accounting_state: 'overlap-skipped' }];

    await expect(saveCodexTokenReport(report())).resolves.toMatchObject({
      windows: 1,
      counted: 0,
      skipped: 1,
      ignored: 0,
    });
  });

  it('keeps a bounded year of machine and token history', async () => {
    await saveCodexTokenReport(report());
    await saveMachineHealth(healthyMachineReport);

    const retentionDeletes = database.queries.filter(query =>
      query.includes('DELETE FROM')
    );
    expect(retentionDeletes).toHaveLength(3);
    for (const query of retentionDeletes) {
      expect(query).toContain("interval '365 days'");
      expect(query).not.toContain("interval '90 days'");
    }
  });
});
