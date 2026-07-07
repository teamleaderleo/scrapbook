import SiteNav from '@/components/site-nav';
import { UsageDashboardContainer } from './usage-dashboard-container';

export function UsagePage() {
  return (
    <main className="min-h-screen bg-sidebar-background">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Proxy Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Usage</h1>
          </div>
        </div>
        <UsageDashboardContainer />
      </div>
    </main>
  );
}
