import ViewportPageShell from '@/components/viewport-page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { MachineHealthDashboardContainer } from './machine-health-dashboard-container';

export function MachineHealthPage() {
  return (
    <ViewportPageShell
      className="bg-[#d8d2c7] text-[#1c1b1d] [background-image:radial-gradient(rgba(77,57,46,0.13)_1px,transparent_1px)] [background-size:22px_22px] dark:bg-[#0f1115] dark:text-[#f1ede5] dark:[background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)]"
      contentClassName="min-h-0"
    >
      <main className="mx-auto w-full max-w-6xl px-3 py-3 pb-10 sm:px-5 sm:py-5 lg:px-7">
        <h1 className="sr-only">Big Red health</h1>
        <div className="border-black/12 bg-[#ece7dd]/88 rounded-[1.75rem] border p-2 shadow-[0_24px_70px_rgba(44,38,31,0.11)] backdrop-blur-sm dark:border-white/10 dark:bg-[#191b21]/90 sm:p-3">
          <Suspense
            fallback={
              <div
                className="grid gap-3"
                role="status"
                aria-label="Loading health check"
              >
                <Skeleton className="h-44 rounded-2xl" />
                <Skeleton className="h-52 rounded-2xl" />
              </div>
            }
          >
            <MachineHealthDashboardContainer />
          </Suspense>
        </div>
      </main>
    </ViewportPageShell>
  );
}
