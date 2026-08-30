import { isAdminUser } from '@/app/lib/auth/admin';
import { createClient } from '@/utils/supabase/server';

export function machineDashboardOwnerAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function machineDashboardOwner() {
  if (!machineDashboardOwnerAuthConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !isAdminUser(data.user)) return null;
    return data.user;
  } catch (error) {
    console.warn('Big Red owner identity check did not complete:', error);
    return null;
  }
}

export async function hasMachineDashboardOwnerSession() {
  return Boolean(await machineDashboardOwner());
}
