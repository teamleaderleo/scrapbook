import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  MACHINE_DASHBOARD_OAUTH_RETURN_COOKIE,
  machineDashboardOAuthOrigin,
  safeAuthDestination,
} from '@/app/lib/machine-dashboard-oauth';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieStore = await cookies();
  const next = safeAuthDestination(
    searchParams.get('next') ??
      cookieStore.get(MACHINE_DASHBOARD_OAUTH_RETURN_COOKIE)?.value
  );
  const returnOrigin = machineDashboardOAuthOrigin(origin);

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        const response = NextResponse.redirect(new URL(next, returnOrigin));
        response.cookies.delete(MACHINE_DASHBOARD_OAUTH_RETURN_COOKIE);
        return response;
      }

      console.warn('[auth/callback] code exchange failed', {
        code: error.code ?? 'exchange_failed',
      });
    } catch {
      console.warn('[auth/callback] code exchange did not complete');
    }
  }

  const errorPath =
    next === '/machine-health'
      ? '/machine-health/access?error=callback'
      : '/space?error=auth';
  const response = NextResponse.redirect(new URL(errorPath, returnOrigin));
  response.cookies.delete(MACHINE_DASHBOARD_OAUTH_RETURN_COOKIE);
  return response;
}
