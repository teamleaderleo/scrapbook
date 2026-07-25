import { NextResponse } from 'next/server';
import { getRecentDateKeys, parsePublicContributionHtml } from '@/lib/github-activity-utils';

const GITHUB_USERNAME = 'teamleaderleo';

export const runtime = 'nodejs';

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const response = await fetch(`https://github.com/users/${GITHUB_USERNAME}/contributions`, {
      cache: 'no-store',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'teamleaderleo-scrapbook',
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) throw new Error(`GitHub contribution page returned ${response.status}`);

    const counts = parsePublicContributionHtml(await response.text());
    if (counts.size === 0) throw new Error('GitHub contribution page could not be parsed');

    const now = new Date();
    const dateKeys = getRecentDateKeys(now, 35);
    const todayKey = dateKeys.at(-1) ?? now.toISOString().slice(0, 10);
    const days = dateKeys.map((date) => ({ date, count: counts.get(date) ?? 0 }));
    const yearTotal = [...counts.entries()]
      .filter(([date]) => date.startsWith(todayKey.slice(0, 4)) && date <= todayKey)
      .reduce((sum, [, count]) => sum + count, 0);

    return NextResponse.json(
      {
        source: 'public-profile',
        generatedAt: now.toISOString(),
        today: days.at(-1)?.count ?? 0,
        weekTotal: days.slice(-7).reduce((sum, day) => sum + day.count, 0),
        yearTotal,
        days: days.slice(-28),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Request-Id': requestId,
        },
      },
    );
  } catch (error) {
    console.error('Unable to refresh GitHub activity', { requestId, error });
    return NextResponse.json(
      { ok: false, error: 'GitHub activity is temporarily unavailable', requestId },
      { status: 502, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId } },
    );
  }
}
