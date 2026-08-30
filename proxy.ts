import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  MACHINE_DASHBOARD_OAUTH_RETURN_COOKIE,
  recoverMachineDashboardOAuthCallback,
} from '@/app/lib/machine-dashboard-oauth';
import { updateSession } from '@/utils/supabase/middleware';

export async function proxy(request: NextRequest) {
  const recoveredCallback = recoverMachineDashboardOAuthCallback(
    request.nextUrl,
    request.cookies.get(MACHINE_DASHBOARD_OAUTH_RETURN_COOKIE)?.value
  );
  if (recoveredCallback) return NextResponse.redirect(recoveredCallback, 307);

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
