import { randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';
import { saveProxyHealth, type ProxyHealthPayload } from '@/app/lib/proxy-health-store';

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  return request.headers.get('x-proxy-health-token')?.trim() ?? '';
}

function expectedHealthToken() {
  if (process.env.PROXY_HEALTH_INGEST_SECRET) return process.env.PROXY_HEALTH_INGEST_SECRET;
  if (process.env.PROXY_HEALTH_TOKEN) return process.env.PROXY_HEALTH_TOKEN;
  if (process.env.NODE_ENV !== 'production') return 'local-test';
  return null;
}

export async function POST(request: NextRequest) {
  const expectedToken = expectedHealthToken();

  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: 'Proxy ingestion credentials are not configured' },
      { status: 500 },
    );
  }

  if (getBearerToken(request) !== expectedToken) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let payload: ProxyHealthPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ ok: false, error: 'payload must be an object' }, { status: 400 });
  }

  const requestId = randomUUID();

  try {
    const result = await saveProxyHealth(payload);
    return NextResponse.json({
      ok: true,
      host: result.host,
      checked_at: result.checkedAt,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Unable to ingest proxy health payload', { requestId, error });
    return NextResponse.json(
      { ok: false, error: 'Proxy report could not be stored', request_id: requestId },
      { status: 500 },
    );
  }
}
