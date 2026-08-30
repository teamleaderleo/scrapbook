import type { User } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

import {
  hasMachineDashboardOwnerSession,
  machineDashboardOwner,
} from './machine-dashboard-owner';

function user(id: string): User {
  return { id } as User;
}

describe('machine dashboard owner session', () => {
  afterEach(() => {
    getUser.mockReset();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('accepts either existing administrator identity', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    for (const id of [
      '7f041d78-8d8d-4d77-934d-6e839c2c7e39',
      '9c838f77-83a9-416e-9bd0-ef18e77424e4',
    ]) {
      getUser.mockResolvedValueOnce({
        data: { user: user(id) },
        error: null,
      });
      await expect(hasMachineDashboardOwnerSession()).resolves.toBe(true);
    }
  });

  it('rejects authenticated identities outside the owner allowlist', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    getUser.mockResolvedValue({
      data: { user: user('somebody-else') },
      error: null,
    });

    await expect(machineDashboardOwner()).resolves.toBeNull();
  });

  it('fails closed when auth is unavailable', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    getUser.mockRejectedValue(new Error('offline'));

    await expect(hasMachineDashboardOwnerSession()).resolves.toBe(false);
  });
});
