import { randomUUID } from 'node:crypto';

import {
  machineHealthPayloadSchema,
  saveMachineHealth,
} from '@/app/lib/machine-health-store';
import { readBoundedText } from '@/app/lib/server/read-bounded-body';
import { timingSafeTokenEqual } from '@/app/lib/server/token-auth';
import { NextRequest, NextResponse } from 'next/server';

const MAX_PAYLOAD_BYTES = 16 * 1_024;
const MAX_REPORT_AGE_MS = 48 * 60 * 60 * 1_000;
const MAX_FUTURE_SKEW_MS = 10 * 60 * 1_000;

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
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'Machine health ingestion is not configured' },
      { status: 500 }
    );
  }
  if (!timingSafeTokenEqual(suppliedToken(request), expected)) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 }
    );
  }

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

  const parsed = machineHealthPayloadSchema.safeParse(value);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'payload does not match the machine health schema' },
      { status: 400 }
    );
  }

  const checkedAt = Date.parse(parsed.data.checked_at);
  const now = Date.now();
  if (
    checkedAt < now - MAX_REPORT_AGE_MS ||
    checkedAt > now + MAX_FUTURE_SKEW_MS
  ) {
    return NextResponse.json(
      { ok: false, error: 'report timestamp is outside the accepted window' },
      { status: 400 }
    );
  }

  const requestId = randomUUID();
  try {
    const result = await saveMachineHealth(parsed.data);
    return NextResponse.json({
      ok: true,
      host: result.host,
      checked_at: result.checkedAt,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Unable to ingest machine health payload', {
      requestId,
      error,
    });
    return NextResponse.json(
      {
        ok: false,
        error: 'Machine report could not be stored',
        request_id: requestId,
      },
      { status: 500 }
    );
  }
}
