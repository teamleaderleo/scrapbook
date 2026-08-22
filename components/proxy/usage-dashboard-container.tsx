import { readLightsailAwsDashboard } from '@/app/lib/lightsail-aws';
import type {
  ProxyHealthPayload,
  ProxyHealthReadResult,
  ProxyHealthSample,
} from '@/app/lib/proxy-health-store';
import { readProxyHealth } from '@/app/lib/proxy-health-store';
import { headers } from 'next/headers';
import { LightsailUsageCard } from './lightsail-usage-card';
import { UsageDashboard } from './usage-dashboard';

function usageLimitBytes() {
  const gb = Number(process.env.PROXY_USAGE_30D_LIMIT_GB ?? '1024');
  const safeGb = Number.isFinite(gb) && gb > 0 ? gb : 1024;
  return safeGb * 1024 ** 3;
}

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function latestStatusSample(
  payload: ProxyHealthPayload
): ProxyHealthSample | null {
  const checkedAt = payload.checked_at;
  if (typeof checkedAt !== 'string') return null;

  return {
    checkedAt,
    rxBytes: numberOrNull(payload.wireguard?.rx_bytes),
    txBytes: numberOrNull(payload.wireguard?.tx_bytes),
    publicLatencyMs: numberOrNull(payload.latency?.public_ms),
    wgLatencyMs: numberOrNull(payload.latency?.wg_ms),
    shanghaiBandwagonMs: numberOrNull(payload.globalping?.bandwagon_ms),
    shanghaiLinodeMs: numberOrNull(payload.globalping?.linode_ms),
    mode: typeof payload.mode === 'string' ? payload.mode : null,
  };
}

function visibleSamples(result: Extract<ProxyHealthReadResult, { status: 'ok' }>) {
  const fallbackSample = latestStatusSample(result.report.payload);
  return result.samples.length > 0 || !fallbackSample
    ? result.samples
    : [fallbackSample];
}

function StateCard({
  title,
  body,
  requestId,
}: {
  title: string;
  body: string;
  requestId?: string;
}) {
  return (
    <section
      className="rounded-2xl border bg-background p-5 shadow-sm"
      role="status"
    >
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {requestId ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Request {requestId}
        </p>
      ) : null}
    </section>
  );
}

export async function UsageDashboardContainer() {
  // The dashboard intentionally reads live provider state and the current clock.
  // Touch request data first so Next.js treats this route as request-dynamic
  // instead of attempting to prerender it during a Vercel production build.
  await headers();

  const [result, lightsailResult] = await Promise.all([
    readProxyHealth('bandwagon-la', 35),
    readLightsailAwsDashboard(),
  ]);

  if (result.status === 'configuration-error') {
    return (
      <StateCard
        title="Proxy configuration missing"
        body={result.message}
        requestId={result.requestId}
      />
    );
  }

  if (result.status === 'error') {
    return (
      <StateCard
        title="Proxy data unavailable"
        body={result.message}
        requestId={result.requestId}
      />
    );
  }

  if (result.status === 'empty') {
    return (
      <StateCard
        title="No report has arrived"
        body="The database connection succeeded, but this host has no stored report yet."
      />
    );
  }

  const bandwagonSamples = visibleSamples(result);
  const lightsailCard =
    lightsailResult.status === 'ok' ? (
      <LightsailUsageCard data={lightsailResult.data} />
    ) : (
      <StateCard
        title="Lightsail AWS API"
        body={
          lightsailResult.status === 'configuration-error'
            ? `${lightsailResult.message} The dashboard is ready for Vercel OIDC once AWS_ROLE_ARN is set.`
            : lightsailResult.message
        }
      />
    );

  return (
    <div className="grid gap-3">
      <UsageDashboard
        samples={bandwagonSamples}
        status={result.report}
        limitBytes={usageLimitBytes()}
      />
      {lightsailCard}
    </div>
  );
}
