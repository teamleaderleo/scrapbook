import { Suspense } from 'react';
import ViewportPageShell from '@/components/viewport-page-shell';
import { CheckInStatus } from './check-in-status';
import { UsageDashboardContainer } from './usage-dashboard-container';

export function UsagePage() {
  return (
    <ViewportPageShell
      className="bg-[#ecebe6] text-[#17181b] dark:bg-[#101115] dark:text-[#eeeae3]"
      contentClassName="min-h-0"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/48 dark:text-white/45">
              Proxy dashboard
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">Usage</h1>
          </div>
          <Suspense fallback={null}>
            <CheckInStatus />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <UsageDashboardContainer />
        </Suspense>
      </div>
    </ViewportPageShell>
  );
}
