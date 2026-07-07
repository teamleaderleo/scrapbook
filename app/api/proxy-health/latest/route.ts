import { NextRequest, NextResponse } from 'next/server';
import { getLatestProxyHealth } from '@/app/lib/proxy-health-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest) {
  const expectedToken = process.env.PROXY_DASHBOARD_TOKEN;
  if (!expectedToken) return true;

  const authorization = request.headers.get('authorization');
  const bearer = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  const queryToken = request.nextUrl.searchParams.get('token') ?? '';

  return bearer === expectedToken || queryToken === expectedToken;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const host = request.nextUrl.searchParams.get('host') ?? 'bandwagon-la';
  const status = await getLatestProxyHealth(host);

  return NextResponse.json({
    ok: true,
    status,
  });
}
