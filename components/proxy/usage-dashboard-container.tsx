import { getLatestProxyHealth, getProxyHealthSamples } from '@/app/lib/proxy-health-store';
import { UsageDashboard } from './usage-dashboard';

function usageLimitBytes() {
  const gb = Number(process.env.PROXY_USAGE_30D_LIMIT_GB ?? '1024');
  const safeGb = Number.isFinite(gb) && gb > 0 ? gb : 1024;
  return safeGb * 1024 ** 3;
}

export async function UsageDashboardContainer() {
  const [status, samples] = await Promise.all([
    getLatestProxyHealth('bandwagon-la'),
    getProxyHealthSamples('bandwagon-la', 35),
  ]);

  if (!status) {
    return (
      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <h2 className="text-xl font-bold">No report yet</h2>
      </div>
    );
  }

  return <UsageDashboard samples={samples} limitBytes={usageLimitBytes()} />;
}
