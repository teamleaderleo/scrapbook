import SiteNav from '@/components/site-nav';
import { UsageDashboardContainer } from './usage-dashboard-container';

export function UsagePage() {
  return (
    <main className="min-h-screen bg-sidebar-background">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Proxy Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Usage</h1>
        </div>
        <UsageDashboardContainer />
      </div>
    </main>
  );
}
