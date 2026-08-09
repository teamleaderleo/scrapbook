import ViewportPageShell from '@/components/viewport-page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { ProxyLiveRefresh } from './proxy-live-refresh';
import { UsageDashboardContainer } from './usage-dashboard-container';

function SignalSkeleton() {
  return (
    <div className="grid gap-3" aria-label="Loading dashboard" role="status">
      <Skeleton className="h-44 rounded-2xl border border-border/70" />
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-32 rounded-xl border border-border/70" />
        <Skeleton className="h-32 rounded-xl border border-border/70" />
        <Skeleton className="h-32 rounded-xl border border-border/70" />
      </div>
    </div>
  );
}

export function UsagePage() {
  return (
    <ViewportPageShell
      className="bg-[#dedbd3] text-[#1b1b1f] dark:bg-[#121419] dark:text-[#f1ede5]"
      contentClassName="min-h-0"
    >
      <ProxyLiveRefresh />
      <main className="mx-auto w-full max-w-7xl px-3 py-3 pb-10 sm:px-5 sm:py-5 lg:px-7">
        <h1 className="sr-only">Signal</h1>
        <div className="rounded-[1.75rem] border border-black/12 bg-[#ebe8e1]/76 p-2 shadow-[0_24px_70px_rgba(44,38,31,0.08)] dark:border-white/10 dark:bg-[#1a1c22]/78 dark:shadow-[0_28px_80px_rgba(0,0,0,0.25)] sm:p-3">
          <Suspense fallback={<SignalSkeleton />}>
            <UsageDashboardContainer />
          </Suspense>
        </div>
      </main>
    </ViewportPageShell>
  );
}
