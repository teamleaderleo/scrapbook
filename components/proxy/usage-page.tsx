import ViewportPageShell from '@/components/viewport-page-shell';
import { Suspense } from 'react';
import { ProxyLiveRefresh } from './proxy-live-refresh';
import { UsageDashboardContainer } from './usage-dashboard-container';

function SignalSkeleton() {
  return (
    <div className="grid animate-pulse gap-3 motion-reduce:animate-none" aria-label="Loading cached signal" role="status">
      <div className="h-44 rounded-2xl border border-border/70 bg-background/55" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-32 rounded-xl border border-border/70 bg-background/45" />
        <div className="h-32 rounded-xl border border-border/70 bg-background/45" />
        <div className="h-32 rounded-xl border border-border/70 bg-background/45" />
      </div>
    </div>
  );
}

export function UsagePage() {
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
              Signal
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">Network pulse</h1>
          </div>
        </div>
        <Suspense fallback={<SignalSkeleton />}>
          <UsageDashboardContainer />
        </Suspense>
      </div>
    </ViewportPageShell>
  );
}
