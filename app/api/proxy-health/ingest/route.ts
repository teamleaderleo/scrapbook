import { randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';
import {
  proxyHealthPayloadSchema,
  saveProxyHealth,
} from '@/app/lib/proxy-health-store';
import { readBoundedText } from '@/app/lib/server/read-bounded-body';
import { timingSafeTokenEqual } from '@/app/lib/server/token-auth';

const MAX_PAYLOAD_BYTES = 64 * 1_024;

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  return request.headers.get('x-proxy-health-token')?.trim() ?? '';
}

function expectedHealthToken() {
  if (process.env.PROXY_HEALTH_INGEST_SECRET)
    return process.env.PROXY_HEALTH_INGEST_SECRET;
  if (process.env.PROXY_HEALTH_TOKEN) return process.env.PROXY_HEALTH_TOKEN;
  if (process.env.NODE_ENV !== 'production') return 'local-test';
  return null;
}

async function readBoundedJson(request: NextRequest) {
  const body = await readBoundedText(request, MAX_PAYLOAD_BYTES);
  if (!body.ok) return { ok: false as const, status: 413, error: body.error };

  try {
    return { ok: true as const, value: JSON.parse(body.value) as unknown };
  } catch {
    return { ok: false as const, status: 400, error: 'invalid JSON body' };
  }
}

export async function POST(request: NextRequest) {
  const expectedToken = expectedHealthToken();

  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: 'Proxy ingestion credentials are not configured' },
      { status: 500 }
    );
  }

  if (!timingSafeTokenEqual(getBearerToken(request), expectedToken)) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 }
    );
  }

  const body = await readBoundedJson(request);
  if (!body.ok) {
    return NextResponse.json(
      { ok: false, error: body.error },
      { status: body.status }
    );
  }

  const parsedPayload = proxyHealthPayloadSchema.safeParse(body.value);
  if (!parsedPayload.success) {
    return NextResponse.json(
      { ok: false, error: 'payload does not match the health report schema' },
      { status: 400 }
    );
  }

  const requestId = randomUUID();

  try {
    const result = await saveProxyHealth(parsedPayload.data);
    return NextResponse.json({
      ok: true,
      host: result.host,
      checked_at: result.checkedAt,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Unable to ingest proxy health payload', {
      requestId,
      error,
    });
    return NextResponse.json(
      {
        ok: false,
        error: 'Proxy report could not be stored',
        request_id: requestId,
      },
      { status: 500 }
    );
  }
}
