import { getGitHubHomeData } from '@/lib/github-home';
import { connection } from 'next/server';
import { NextResponse } from 'next/server';

const CLIENT_REFRESH_SECONDS = 60;
const UPSTREAM_CACHE_SECONDS = 300;

export async function GET() {
  await connection();
  const requestId = crypto.randomUUID();

  try {
    const activity = await getGitHubHomeData();

    if (activity.source === 'unavailable') {
      return NextResponse.json(
        { ok: false, error: 'GitHub activity is temporarily unavailable', requestId },
        { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId } },
      );
    }

    return NextResponse.json(
      {
        source: activity.source,
        generatedAt: activity.generatedAt,
        today: activity.today,
        weekTotal: activity.weekTotal,
        yearTotal: activity.periodLabel === 'this year' ? activity.total : null,
        days: activity.days.slice(-28),
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CLIENT_REFRESH_SECONDS}, stale-while-revalidate=3600`,
          'X-Activity-Source': activity.source,
          'X-Activity-Generated-At': activity.generatedAt,
          'X-Client-Refresh-Seconds': String(CLIENT_REFRESH_SECONDS),
          'X-Upstream-Cache-Seconds': String(UPSTREAM_CACHE_SECONDS),
          'X-Request-Id': requestId,
        },
      },
    );
  } catch (error) {
    console.error('Unable to refresh GitHub activity', { requestId, error });
    return NextResponse.json(
      { ok: false, error: 'GitHub activity is temporarily unavailable', requestId },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId } },
    );
  }
}
