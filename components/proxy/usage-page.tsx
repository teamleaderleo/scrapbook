import ViewportPageShell from '@/components/viewport-page-shell';
import { Suspense } from 'react';
import { UsageDashboardContainer } from './usage-dashboard-container';
import { UsageDashboardSkeleton } from './usage-dashboard-skeleton';

export function UsagePage() {
  return (
    <ViewportPageShell
      className="bg-[#ecebe6] text-[#17181b] dark:bg-[#101115] dark:text-[#eeeae3]"
      contentClassName="min-h-0"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
              Proxy dashboard
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">Usage</h1>
          </div>
        </div>
        <Suspense fallback={<UsageDashboardSkeleton />}>
          <UsageDashboardContainer />
        </Suspense>
      </div>
    </ViewportPageShell>
  );
}
