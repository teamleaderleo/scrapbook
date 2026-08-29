import {
  MACHINE_DASHBOARD_ACCESS_SECONDS,
  MACHINE_DASHBOARD_COOKIE,
  machineDashboardAccessCookie,
  machineDashboardSecret,
} from '@/app/lib/server/machine-dashboard-access';
import { readBoundedText } from '@/app/lib/server/read-bounded-body';
import { timingSafeTokenEqual } from '@/app/lib/server/token-auth';
import { NextRequest, NextResponse } from 'next/server';

const ACCESS_FORM = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Big Red health access</title>
    <style>
      :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #e9e4da; color: #2d2a26; }
      form { width: min(24rem, calc(100vw - 2rem)); padding: 1.5rem; border: 1px solid #b9ad9d; border-radius: 1rem; background: #fffdf8; box-shadow: 0 1rem 3rem #453d3020; }
      label { display: block; margin-bottom: .75rem; font-weight: 700; }
      input, button { box-sizing: border-box; width: 100%; min-height: 2.75rem; border-radius: .65rem; font: inherit; }
      input { border: 1px solid #9f9485; padding: .65rem .75rem; background: transparent; color: inherit; }
      button { margin-top: .75rem; border: 0; background: #a8342e; color: #fff; cursor: pointer; }
      p { margin: .75rem 0 0; color: #6d6459; font-size: .875rem; line-height: 1.5; }
      @media (prefers-color-scheme: dark) { body { background: #17191d; color: #f2eee6; } form { background: #22252a; border-color: #51545a; } input { border-color: #6a6d73; } p { color: #b9b4aa; } }
    </style>
  </head>
  <body>
    <form method="post" action="/machine-health/access">
      <label for="token">Big Red health access token</label>
      <input id="token" name="token" type="password" autocomplete="current-password" required autofocus />
      <button type="submit">Open health check</button>
      <p>The token is exchanged for a seven-day private cookie and never appears in the URL.</p>
    </form>
  </body>
</html>`;

const privateHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export function GET() {
  if (!machineDashboardSecret())
    return NextResponse.json(
      { ok: false, error: 'not found' },
      { status: 404, headers: privateHeaders }
    );
  return new NextResponse(ACCESS_FORM, {
    headers: { ...privateHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  });
}

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
    new URL('/machine-health', request.url)
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
