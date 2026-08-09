import type { User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { requireSpaceAdmin } from './authorization';

const admin = { id: '7f041d78-8d8d-4d77-934d-6e839c2c7e39' } as User;

function authClient(
  user: User | null,
  error: { message: string } | null = null
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
  };
}

describe('requireSpaceAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a freshly verified administrator', async () => {
    await expect(requireSpaceAdmin(authClient(admin))).resolves.toBe(admin);
  });

  it('rejects missing and failed Supabase identities', async () => {
    await expect(requireSpaceAdmin(authClient(null))).rejects.toThrow(
      'You must be signed in to change Space.'
    );
    await expect(
      requireSpaceAdmin(authClient(admin, { message: 'expired' }))
    ).rejects.toThrow('You must be signed in to change Space.');
  });

  it('rejects authenticated users outside the administrator allowlist', async () => {
    const user = { id: '24bb5d50-6dd6-414d-b890-1e2692ca9c8a' } as User;
    await expect(requireSpaceAdmin(authClient(user))).rejects.toThrow(
      'You are not allowed to change Space.'
    );
  });
});
