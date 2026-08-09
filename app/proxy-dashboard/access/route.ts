import { NextRequest, NextResponse } from 'next/server';

import {
  PROXY_DASHBOARD_ACCESS_SECONDS,
  PROXY_DASHBOARD_COOKIE,
  proxyDashboardAccessCookie,
  proxyDashboardSecret,
} from '@/app/lib/server/proxy-dashboard-access';
import { readBoundedText } from '@/app/lib/server/read-bounded-body';
import { timingSafeTokenEqual } from '@/app/lib/server/token-auth';

const ACCESS_FORM = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Proxy dashboard access</title>
    <style>
      :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #eee9df; color: #302d28; }
      form { width: min(24rem, calc(100vw - 2rem)); padding: 1.5rem; border: 1px solid #b8ad9d; border-radius: 1rem; background: #fffdf8; box-shadow: 0 1rem 3rem #453d3020; }
      label { display: block; margin-bottom: .75rem; font-weight: 650; }
      input, button { box-sizing: border-box; width: 100%; min-height: 2.75rem; border-radius: .65rem; font: inherit; }
      input { border: 1px solid #9f9485; padding: .65rem .75rem; background: transparent; color: inherit; }
      button { margin-top: .75rem; border: 0; background: #37322c; color: #fff; cursor: pointer; }
      p { margin: .75rem 0 0; color: #6d6459; font-size: .875rem; line-height: 1.5; }
      @media (prefers-color-scheme: dark) { body { background: #1d1b18; color: #eee8dc; } form { background: #292621; border-color: #575044; } input { border-color: #71685a; } button { background: #eee8dc; color: #25211c; } p { color: #b9b0a3; } }
    </style>
  </head>
  <body>
    <form method="post" action="/proxy-dashboard/access">
      <label for="token">Proxy dashboard access token</label>
      <input id="token" name="token" type="password" autocomplete="current-password" required autofocus />
      <button type="submit">Open dashboard</button>
      <p>The token is sent in the request body and exchanged for a seven-day private cookie.</p>
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
  if (!proxyDashboardSecret()) {
    return NextResponse.json(
      { ok: false, error: 'not found' },
      { status: 404, headers: privateHeaders }
    );
  }

  return new NextResponse(ACCESS_FORM, {
    headers: { ...privateHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(request: NextRequest) {
  const secret = proxyDashboardSecret();
  const body = await readBoundedText(request, 4_096);
  const suppliedToken = body.ok
    ? (new URLSearchParams(body.value).get('token') ?? '')
    : '';

  if (!secret || !timingSafeTokenEqual(suppliedToken, secret)) {
    return NextResponse.json(
      { ok: false, error: 'not found' },
      { status: 404, headers: privateHeaders }
    );
  }

  const destination = new URL('/proxy-dashboard', request.url);
  const response = NextResponse.redirect(destination);
  response.cookies.set({
    name: PROXY_DASHBOARD_COOKIE,
    value: proxyDashboardAccessCookie(secret),
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/proxy-dashboard',
    maxAge: PROXY_DASHBOARD_ACCESS_SECONDS,
  });
  for (const [name, value] of Object.entries(privateHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}
