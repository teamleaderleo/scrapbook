import {
  MACHINE_DASHBOARD_OAUTH_RETURN_COOKIE,
  MACHINE_DASHBOARD_PATH,
  machineDashboardOAuthOrigin,
} from '@/app/lib/machine-dashboard-oauth';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

type OAuthProvider = 'google' | 'github';

function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'github';
}

function accessError(request: NextRequest, reason: string) {
  const url = new URL('/machine-health', request.url);
  url.searchParams.set('auth', reason);
  return NextResponse.redirect(url, 303);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!isOAuthProvider(provider)) return accessError(request, 'provider');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return accessError(request, 'configuration');
  }

  let expectedAuthorizationOrigin: string;
  try {
    expectedAuthorizationOrigin = new URL(supabaseUrl).origin;
  } catch {
    return accessError(request, 'configuration');
  }

  const returnOrigin = machineDashboardOAuthOrigin(request.nextUrl.origin);
  let data: { url: string | null };
  let error: { code?: string } | null;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${returnOrigin}/auth/callback` },
    });
    data = result.data;
    error = result.error;
  } catch {
    console.warn('[machine-health/oauth] sign-in start did not complete', {
      provider,
    });
    return accessError(request, 'start');
  }

  if (error || !data.url) {
    console.warn('[machine-health/oauth] sign-in did not start', {
      provider,
      code: error?.code ?? 'missing_redirect',
    });
    return accessError(request, 'start');
  }

  let authorizationUrl: URL;
  try {
    authorizationUrl = new URL(data.url);
  } catch {
    return accessError(request, 'start');
  }
  if (authorizationUrl.origin !== expectedAuthorizationOrigin) {
    console.warn('[machine-health/oauth] rejected unexpected redirect origin', {
      provider,
    });
    return accessError(request, 'start');
  }

  const cookieStore = await cookies();
  cookieStore.set(
    MACHINE_DASHBOARD_OAUTH_RETURN_COOKIE,
    MACHINE_DASHBOARD_PATH,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    }
  );

  return NextResponse.redirect(authorizationUrl, 303);
}
