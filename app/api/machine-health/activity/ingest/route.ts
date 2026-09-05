import { NextRequest, NextResponse } from 'next/server';
import { activitySnapshotSchema } from '@/app/lib/machine-activity';
import { saveMachineActivity } from '@/app/lib/machine-activity-store';
import { readBoundedText } from '@/app/lib/server/read-bounded-body';
import { timingSafeTokenEqual } from '@/app/lib/server/token-auth';

export async function POST(request: NextRequest) {
  const expected =
    process.env.MACHINE_HEALTH_INGEST_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'local-test' : null);
  const supplied =
    request.headers.get('authorization')?.replace(/^Bearer /, '') ??
    request.headers.get('x-machine-health-token') ??
    '';
  if (!expected || !timingSafeTokenEqual(supplied, expected))
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await readBoundedText(request, 32 * 1024);
  if (!body.ok)
    return NextResponse.json({ error: body.error }, { status: 413 });
  let value: unknown;
  try {
    value = JSON.parse(body.value);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  const parsed = activitySnapshotSchema.safeParse(value);
  if (!parsed.success)
    return NextResponse.json(
      { error: 'invalid activity snapshot' },
      { status: 400 }
    );
  const age = Date.now() - Date.parse(parsed.data.checked_at);
  if (age > 5 * 60000 || age < -60000)
    return NextResponse.json(
      { error: 'snapshot is outside the accepted window' },
      { status: 400 }
    );
  try {
    await saveMachineActivity(parsed.data);
    return NextResponse.json({
      ok: true,
      host: parsed.data.host,
      checked_at: parsed.data.checked_at,
    });
  } catch {
    return NextResponse.json(
      { error: 'Activity snapshot could not be stored' },
      { status: 503 }
    );
  }
}
