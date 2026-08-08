import { randomUUID } from 'node:crypto';

import { client } from '@/app/lib/db/db';
import { timingSafeTokenEqual } from '@/app/lib/server/token-auth';
import { NextRequest, NextResponse } from 'next/server';

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Bearer '))
    return authorization.slice('Bearer '.length).trim();
  return request.headers.get('x-proxy-health-token')?.trim() ?? '';
}

function diagnosticSecret() {
  return (
    process.env.PROXY_HEALTH_DIAGNOSTIC_SECRET ??
    process.env.PROXY_HEALTH_INGEST_SECRET ??
    process.env.PROXY_HEALTH_TOKEN ??
    null
  );
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const expected = diagnosticSecret();

  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Diagnostic credentials are not configured',
        request_id: requestId,
      },
      { status: 503 }
    );
  }

  if (!timingSafeTokenEqual(bearerToken(request), expected)) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized', request_id: requestId },
      { status: 401 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        request_id: requestId,
        database_connected: false,
        database_configured: false,
        ingestion_configured: Boolean(
          process.env.PROXY_HEALTH_INGEST_SECRET ??
            process.env.PROXY_HEALTH_TOKEN
        ),
      },
      { status: 503 }
    );
  }

  try {
    const tableRows = await client<
      {
        status_exists: boolean;
        samples_exists: boolean;
      }[]
    >`
      SELECT
        to_regclass('public.proxy_health_status') IS NOT NULL AS status_exists,
        to_regclass('public.proxy_health_samples') IS NOT NULL AS samples_exists
    `;
    const tables = tableRows[0] ?? {
      status_exists: false,
      samples_exists: false,
    };

    let latestCheckedAt: string | null = null;
    let recentSamples = 0;

    if (tables.status_exists) {
      const latestRows = await client<{ checked_at: Date | string | null }[]>`
        SELECT checked_at
        FROM proxy_health_status
        ORDER BY checked_at DESC NULLS LAST
        LIMIT 1
      `;
      const checkedAt = latestRows[0]?.checked_at;
      latestCheckedAt = checkedAt ? new Date(checkedAt).toISOString() : null;
    }

    if (tables.samples_exists) {
      const countRows = await client<{ count: number | string | bigint }[]>`
        SELECT count(*) AS count
        FROM proxy_health_samples
        WHERE checked_at >= now() - interval '24 hours'
      `;
      recentSamples = Number(countRows[0]?.count ?? 0);
    }

    return NextResponse.json({
      ok: tables.status_exists && tables.samples_exists,
      request_id: requestId,
      database_connected: true,
      database_configured: true,
      tables: {
        proxy_health_status: tables.status_exists,
        proxy_health_samples: tables.samples_exists,
      },
      latest_checked_at: latestCheckedAt,
      recent_samples_24h: recentSamples,
      ingestion_configured: Boolean(
        process.env.PROXY_HEALTH_INGEST_SECRET ?? process.env.PROXY_HEALTH_TOKEN
      ),
    });
  } catch (error) {
    console.error('Proxy diagnostic failed', { requestId, error });
    return NextResponse.json(
      {
        ok: false,
        error: 'Proxy diagnostic failed',
        request_id: requestId,
        database_connected: false,
        database_configured: true,
        ingestion_configured: Boolean(
          process.env.PROXY_HEALTH_INGEST_SECRET ??
            process.env.PROXY_HEALTH_TOKEN
        ),
      },
      { status: 500 }
    );
  }
}
