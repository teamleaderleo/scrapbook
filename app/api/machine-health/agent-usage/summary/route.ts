import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readPeerUsageSamples } from '@/app/lib/agent-usage-store';
import { summarizePeerUsage } from '@/app/lib/peer-usage-summary';
import { hasMachineDashboardOwnerSession } from '@/app/lib/server/machine-dashboard-owner';
import {
  MACHINE_DASHBOARD_COOKIE,
  hasMachineDashboardAccess,
  machineDashboardSecret,
} from '@/app/lib/server/machine-dashboard-access';

const MAX_DAYS = 365;

export async function GET(request: Request) {
  const secret = machineDashboardSecret();
  const cookieStore = await cookies();
  const privateAccess =
    process.env.NODE_ENV !== 'production' ||
    Boolean(
      secret &&
        hasMachineDashboardAccess(
          cookieStore.get(MACHINE_DASHBOARD_COOKIE)?.value,
          secret
        )
    ) ||
    (await hasMachineDashboardOwnerSession());
  if (!privateAccess)
    return NextResponse.json(
      { ok: false, error: 'peer usage summary requires private access' },
      {
        status: 403,
        headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
      }
    );

  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get('days') ?? '30');
  const days = Number.isFinite(requestedDays)
    ? Math.max(1, Math.min(MAX_DAYS, Math.floor(requestedDays)))
    : 30;
  const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
  try {
    const groups = summarizePeerUsage(await readPeerUsageSamples(days));
    return NextResponse.json(
      {
        ok: true,
        schema: 'peer-usage-summary/v1',
        days,
        generated_at: new Date().toISOString(),
        unavailable: groups.length === 0,
        groups: groups.map(group => ({
          provider: group.provider,
          harness: group.harness,
          lane: group.lane,
          model: group.model,
          effort: group.effort,
          hours_observed: group.hoursObserved,
          runs: group.runsUnknown ? null : group.runs,
          successful_runs: group.successfulRuns,
          input_tokens: group.inputTokens,
          cached_input_tokens: group.cachedInputTokens,
          cache_write_input_tokens: group.cacheWriteInputTokens,
          output_tokens: group.outputTokens,
          reasoning_output_tokens: group.reasoningTokens,
          total_tokens: group.totalTokens,
          api_equivalent_estimate_usd: group.apiEquivalentEstimateUsd,
        })),
      },
      { headers }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Peer usage summary is waiting for reports' },
      { status: 503, headers }
    );
  }
}
