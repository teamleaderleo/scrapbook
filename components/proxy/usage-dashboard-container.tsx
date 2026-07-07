import { getLatestProxyHealth, getProxyHealthSamples } from '@/app/lib/proxy-health-store';
import { UsageDashboard } from './usage-dashboard';

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

  return <UsageDashboard payload={status.payload} samples={samples} updatedAt={status.updatedAt} />;
}
