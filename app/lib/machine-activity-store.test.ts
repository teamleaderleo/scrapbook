import { beforeEach, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ query: vi.fn(), begin: vi.fn() }));
vi.mock('./db/db', () => ({
  client: Object.assign(db.query, { begin: db.begin }),
}));
import { activitySnapshot } from '@/tests/fixtures/machine-activity';
import {
  readMachineActivity,
  saveMachineActivity,
} from './machine-activity-store';
beforeEach(() => {
  db.query.mockReset();
  db.begin.mockReset();
});
it('never returns process identity in public responses or historical rows', async () => {
  db.query.mockResolvedValue([
    { payload: { ...activitySnapshot, checked_at: new Date().toISOString() } },
  ]);
  const data = await readMachineActivity(false);
  expect(JSON.stringify(data)).not.toContain('PRIVATE-PROCESS');
  const privateData = await readMachineActivity(true);
  expect(privateData.latest[0].processes?.[0].name).toBe('PRIVATE-PROCESS');
  expect(privateData.history[0]).not.toHaveProperty('processes');
});
it('expires private detail on read even if both collectors have stopped', async () => {
  db.query.mockResolvedValue([
    {
      payload: {
        ...activitySnapshot,
        checked_at: new Date(Date.now() - 16 * 60000).toISOString(),
      },
    },
  ]);
  expect(JSON.stringify(await readMachineActivity(true))).not.toContain(
    'PRIVATE-PROCESS'
  );
});
it('guards both upserts against stale arrivals and stores only aggregates in history', async () => {
  const queries: { sql: string; values: unknown[] }[] = [];
  db.begin.mockImplementation(async fn =>
    fn(
      Object.assign(
        async (strings: TemplateStringsArray, ...values: unknown[]) => {
          queries.push({ sql: strings.join('?'), values });
          return [];
        },
        { json: (value: unknown) => value }
      )
    )
  );
  await saveMachineActivity(activitySnapshot);
  const status = queries.find(query =>
    query.sql.includes('INSERT INTO machine_activity_status')
  )!;
  const samples = queries.find(query =>
    query.sql.includes('INSERT INTO machine_activity_samples')
  )!;
  expect(status.sql).toContain(
    'WHERE machine_activity_status.checked_at <= EXCLUDED.checked_at'
  );
  expect(samples.sql).toContain(
    'WHERE machine_activity_samples.checked_at <= EXCLUDED.checked_at'
  );
  expect(JSON.stringify(samples.values)).not.toContain('PRIVATE-PROCESS');
});
