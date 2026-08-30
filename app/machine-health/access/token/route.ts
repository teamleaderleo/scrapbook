import {
  MACHINE_DASHBOARD_ACCESS_SECONDS,
  MACHINE_DASHBOARD_COOKIE,
  machineDashboardAccessCookie,
  machineDashboardSecret,
} from '@/app/lib/server/machine-dashboard-access';
import { readBoundedText } from '@/app/lib/server/read-bounded-body';
import { timingSafeTokenEqual } from '@/app/lib/server/token-auth';
import { NextRequest, NextResponse } from 'next/server';

const privateHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy':
    "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: NextRequest) {
  const secret = machineDashboardSecret();
  const body = await readBoundedText(request, 4_096);
  const token = body.ok
    ? (new URLSearchParams(body.value).get('token') ?? '')
    : '';
  if (!secret || !timingSafeTokenEqual(token, secret))
    return NextResponse.json(
      { ok: false, error: 'not found' },
      { status: 404, headers: privateHeaders }
    );

  const response = NextResponse.redirect(
    new URL('/machine-health', request.url),
    303
  );
  response.cookies.set({
    name: MACHINE_DASHBOARD_COOKIE,
    value: machineDashboardAccessCookie(secret),
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/machine-health',
    maxAge: MACHINE_DASHBOARD_ACCESS_SECONDS,
  });
  for (const [name, value] of Object.entries(privateHeaders))
    response.headers.set(name, value);
  return response;
}
