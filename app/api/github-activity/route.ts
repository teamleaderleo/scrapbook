import { createGitHubActivityHeaders } from '@/lib/github-activity-response';
import { getGitHubHomeResult } from '@/lib/github-home';
import { connection } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET() {
  await connection();
  const requestId = crypto.randomUUID();

  try {
    const result = await getGitHubHomeResult();
    const { activity, diagnostics } = result;
    const headers = createGitHubActivityHeaders(result, requestId);

    if (activity.source === 'unavailable') {
      headers.set('Cache-Control', 'no-store');
      return NextResponse.json(
        {
          ok: false,
          error: 'GitHub activity is temporarily unavailable',
          requestId,
          diagnostics,
        },
        { status: 503, headers },
      );
    }

    return NextResponse.json(
      {
        source: activity.source,
        generatedAt: activity.generatedAt,
        today: activity.today,
        weekTotal: activity.weekTotal,
        yearTotal: activity.periodLabel === 'last year' ? activity.total : null,
        days: activity.days.slice(-35),
        diagnostics,
      },
      { headers },
    );
  } catch (error) {
    console.error('Unable to refresh GitHub activity', { requestId, error });
    return NextResponse.json(
      { ok: false, error: 'GitHub activity is temporarily unavailable', requestId },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId } },
    );
  }
}
