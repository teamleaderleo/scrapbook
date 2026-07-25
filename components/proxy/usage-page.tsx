import ViewportPageShell from '@/components/viewport-page-shell';
import { CheckInStatus } from './check-in-status';
import { UsageDashboardContainer } from './usage-dashboard-container';

export function UsagePage() {
  return (
    <ViewportPageShell className="bg-sidebar-background">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Proxy Dashboard
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">Usage</h1>
          </div>
          <CheckInStatus />
        </div>
        <UsageDashboardContainer />
      </div>
    </ViewportPageShell>
  );
}
