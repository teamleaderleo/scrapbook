import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const save = vi.hoisted(() => vi.fn());
vi.mock('@/app/lib/machine-activity-store', () => ({
  saveMachineActivity: save,
}));
import { activitySnapshot } from '@/tests/fixtures/machine-activity';
import { POST } from './route';
beforeEach(() => {
  vi.stubEnv('MACHINE_HEALTH_INGEST_SECRET', 'test-secret');
  save.mockReset();
  save.mockResolvedValue(undefined);
});
const request = (payload: unknown, token = 'test-secret') =>
  new NextRequest('https://example.test/api/machine-health/activity/ingest', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
it('requires the existing ingest credential before storing any data', async () => {
  expect((await POST(request(activitySnapshot, 'wrong'))).status).toBe(401);
  expect(save).not.toHaveBeenCalled();
});
it('accepts fresh bounded snapshots and rejects stale observations', async () => {
  expect(
    (
      await POST(
        request({ ...activitySnapshot, checked_at: new Date().toISOString() })
      )
    ).status
  ).toBe(200);
  expect(
    (
      await POST(
        request({
          ...activitySnapshot,
          checked_at: new Date(Date.now() - 10 * 60000).toISOString(),
        })
      )
    ).status
  ).toBe(400);
  expect(save).toHaveBeenCalledTimes(1);
});
it('rejects oversized bodies before parsing private process data', async () => {
  expect((await POST(request({ padding: 'a'.repeat(40000) }))).status).toBe(
    413
  );
  expect(save).not.toHaveBeenCalled();
});
