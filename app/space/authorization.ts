import 'server-only';

import type { User } from '@supabase/supabase-js';
import { isAdminUser } from '@/app/lib/auth/admin';

type SpaceAuthClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: User | null };
      error: { message?: string } | null;
    }>;
  };
};

/**
 * Verifies the current identity with Supabase Auth and applies Scrapbook's
 * explicit Space administrator allowlist before any mutation is attempted.
 * Database RLS remains a required second boundary.
 */
export async function requireSpaceAdmin(
  client: SpaceAuthClient
): Promise<User> {
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error('You must be signed in to change Space.');
  }

  if (!isAdminUser(data.user)) {
    throw new Error('You are not allowed to change Space.');
  }

  return data.user;
}
