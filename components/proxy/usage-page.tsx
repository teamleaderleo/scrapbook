import ViewportPageShell from '@/components/viewport-page-shell';
import { ProxyLiveRefresh } from './proxy-live-refresh';
import { UsageDashboardContainer } from './usage-dashboard-container';

export async function UsagePage() {
  return (
    <ViewportPageShell
      className="bg-[#dfdbd2] text-[#1b1b1f] dark:bg-[#15171b] dark:text-[#f1ede5]"
      contentClassName="min-h-0"
    >
      <ProxyLiveRefresh />
      <div className="mx-auto w-full max-w-7xl px-4 py-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/58 dark:text-white/62">
              Proxy dashboard
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">Usage</h1>
          </div>
        </div>
        <UsageDashboardContainer />
      </div>
    </ViewportPageShell>
  );
}
