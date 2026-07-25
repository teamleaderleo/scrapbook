import 'server-only';
import type { User } from '@supabase/supabase-js';

const ADMIN_USER_IDS = new Set([
  '7f041d78-8d8d-4d77-934d-6e839c2c7e39',
  '9c838f77-83a9-416e-9bd0-ef18e77424e4',
]);

export function isAdminUser(user: User | null): boolean {
  return Boolean(user && ADMIN_USER_IDS.has(user.id));
}
