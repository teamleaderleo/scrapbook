import { randomUUID } from 'node:crypto';

import {
  codexTokenReportSchema,
  saveCodexTokenReport,
} from '@/app/lib/machine-health-store';
import { readBoundedText } from '@/app/lib/server/read-bounded-body';
import { timingSafeTokenEqual } from '@/app/lib/server/token-auth';
import { NextRequest, NextResponse } from 'next/server';

const MAX_PAYLOAD_BYTES = 512 * 1_024;
const MAX_REPORT_AGE_MS = 48 * 60 * 60 * 1_000;
const MAX_HISTORY_AGE_MS = 90 * 24 * 60 * 60 * 1_000;
const MAX_FUTURE_SKEW_MS = 10 * 60 * 1_000;
const HOUR_MS = 60 * 60 * 1_000;

function suppliedToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Bearer '))
    return authorization.slice('Bearer '.length).trim();
  return request.headers.get('x-machine-health-token')?.trim() ?? '';
}

function expectedToken() {
  if (process.env.MACHINE_HEALTH_INGEST_SECRET)
    return process.env.MACHINE_HEALTH_INGEST_SECRET;
  if (process.env.NODE_ENV !== 'production') return 'local-test';
  return null;
}

export async function POST(request: NextRequest) {
  const expected = expectedToken();
  if (!expected)
    return NextResponse.json(
      { ok: false, error: 'Codex token ingestion is not configured' },
      { status: 500 }
    );
  if (!timingSafeTokenEqual(suppliedToken(request), expected))
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 }
    );

  const body = await readBoundedText(request, MAX_PAYLOAD_BYTES);
  if (!body.ok)
    return NextResponse.json({ ok: false, error: body.error }, { status: 413 });

  let value: unknown;
  try {
    value = JSON.parse(body.value);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = codexTokenReportSchema.safeParse(value);
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, error: 'payload does not match the token report schema' },
      { status: 400 }
    );

  const now = Date.now();
  const collectedAt = Date.parse(parsed.data.collected_at);
  const completeHourEnd = Math.floor(now / HOUR_MS) * HOUR_MS;
  const invalidTime =
    collectedAt < now - MAX_REPORT_AGE_MS ||
    collectedAt > now + MAX_FUTURE_SKEW_MS ||
    parsed.data.windows.some(window => {
      const start = Date.parse(window.window_started_at);
      const end = Date.parse(window.window_ended_at);
      return start < now - MAX_HISTORY_AGE_MS || end > completeHourEnd;
    });
  if (invalidTime)
    return NextResponse.json(
      { ok: false, error: 'report timestamp is outside the accepted window' },
      { status: 400 }
    );

  const requestId = randomUUID();
  try {
    const result = await saveCodexTokenReport(parsed.data);
    return NextResponse.json({
      ok: true,
      source: result.source,
      windows: result.windows,
      counted: result.counted,
      skipped: result.skipped,
      collected_at: result.collectedAt,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Unable to ingest Codex token report', { requestId, error });
    return NextResponse.json(
      {
        ok: false,
        error: 'Codex token report could not be stored',
        request_id: requestId,
      },
      { status: 500 }
    );
  }
}
