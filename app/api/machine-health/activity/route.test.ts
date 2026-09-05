import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ owner: vi.fn(), read: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock('@/app/lib/server/machine-dashboard-owner', () => ({
  hasMachineDashboardOwnerSession: mocks.owner,
}));
vi.mock('@/app/lib/machine-activity-store', () => ({
  readMachineActivity: mocks.read,
}));
import { GET } from './route';
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('MACHINE_HEALTH_DASHBOARD_TOKEN', '');
  vi.stubEnv('PROXY_DASHBOARD_TOKEN', '');
  mocks.owner.mockResolvedValue(false);
  mocks.read.mockReset();
  mocks.read.mockResolvedValue({
    latest: [],
    history: [],
    privateAccess: false,
  });
});
it('uses public projection by default and prevents shared caching', async () => {
  const response = await GET();
  expect(mocks.read).toHaveBeenCalledWith(false);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(response.headers.get('vary')).toBe('Cookie');
});
it('grants private detail only after the existing owner check succeeds', async () => {
  mocks.owner.mockResolvedValue(true);
  await GET();
  expect(mocks.read).toHaveBeenCalledWith(true);
});
it('returns a recoverable unavailable state without leaking database errors', async () => {
  mocks.read.mockRejectedValue(new Error('private database contents'));
  const response = await GET();
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('database');
});
