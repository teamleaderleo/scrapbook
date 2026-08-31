import { randomUUID } from 'node:crypto';

import { agentTelemetryEnvelopeSchema } from '@/app/lib/agent-usage-contract';
import {
  AgentTelemetryReplayConflict,
  saveAgentTelemetryReport,
} from '@/app/lib/agent-usage-store';
import { readBoundedText } from '@/app/lib/server/read-bounded-body';
import { timingSafeTokenEqual } from '@/app/lib/server/token-auth';
import { NextRequest, NextResponse } from 'next/server';

const MAX_PAYLOAD_BYTES = 512 * 1_024;
const MAX_REPORT_AGE_MS = 48 * 60 * 60 * 1_000;
const MAX_HISTORY_AGE_MS = 90 * 24 * 60 * 60 * 1_000;
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
  if (!expected)
    return NextResponse.json(
      { ok: false, error: 'Agent telemetry ingestion is not configured' },
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

  const parsed = agentTelemetryEnvelopeSchema.safeParse(value);
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, error: 'payload does not match the agent telemetry schema' },
      { status: 400 }
    );
  if (parsed.data.usage_samples.length + parsed.data.quota_samples.length === 0)
    return NextResponse.json(
      { ok: false, error: 'agent telemetry report contains no samples' },
      { status: 400 }
    );

  const now = Date.now();
  const collectedAt = Date.parse(parsed.data.collected_at);
  const sampleTimes = [
    ...parsed.data.usage_samples.map(sample => Date.parse(sample.observed_at)),
    ...parsed.data.quota_samples.map(sample => Date.parse(sample.observed_at)),
  ];
  const invalidTime =
    collectedAt < now - MAX_REPORT_AGE_MS ||
    collectedAt > now + MAX_FUTURE_SKEW_MS ||
    sampleTimes.some(
      observedAt =>
        observedAt < now - MAX_HISTORY_AGE_MS ||
        observedAt > now + MAX_FUTURE_SKEW_MS
    );
  if (invalidTime)
    return NextResponse.json(
      { ok: false, error: 'report timestamp is outside the accepted window' },
      { status: 400 }
    );

  const requestId = randomUUID();
  try {
    const result = await saveAgentTelemetryReport(parsed.data);
    return NextResponse.json({
      ok: true,
      source: result.source,
      usage_inserted: result.usageInserted,
      usage_replayed: result.usageReplayed,
      quota_inserted: result.quotaInserted,
      quota_replayed: result.quotaReplayed,
      collected_at: result.collectedAt,
      request_id: requestId,
    });
  } catch (error) {
    if (error instanceof AgentTelemetryReplayConflict)
      return NextResponse.json(
        {
          ok: false,
          error: 'telemetry sample replay conflicts with immutable stored facts',
          sample_class: error.sampleClass,
          request_id: requestId,
        },
        { status: 409 }
      );

    console.error('Unable to ingest agent telemetry report', { requestId, error });
    return NextResponse.json(
      {
        ok: false,
        error: 'Agent telemetry report could not be stored',
        request_id: requestId,
      },
      { status: 500 }
    );
  }
}
