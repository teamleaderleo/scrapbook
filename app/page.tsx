import { ActivityDashboard } from '@/components/home/activity-dashboard';
import { WindLiftCard } from '@/components/home/wind-lift-card';
import ViewportPageShell from '@/components/viewport-page-shell';
import { getGitHubHomeData } from '@/lib/github-home';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leo · GitHub activity',
  description: 'Recent public GitHub activity from teamleaderleo.',
  alternates: { canonical: '/' },
};

export default async function Page() {
  const activity = await getGitHubHomeData();
  const unit = activity.source === 'public-events' ? 'public actions' : 'contributions';
  const days = activity.days.slice(-28);
  const yearTotal = activity.periodLabel === 'this year' ? activity.total : null;

  return (
    <ViewportPageShell
      className="relative bg-background text-foreground"
      contentClassName="relative min-h-[calc(100dvh-3rem)] overflow-x-hidden text-inherit"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-12"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl flex-col justify-center px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
          <ActivityDashboard
            initial={{
              today: activity.today,
              weekTotal: activity.weekTotal,
              yearTotal,
              days,
              unit,
              generatedAt: activity.generatedAt,
            }}
          />

          <section aria-label="Recent systems" className="min-w-0">
            <div className="flex items-center justify-between gap-4 px-0.5">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
                Recent systems
              </p>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                {activity.repositories.length} projects
              </span>
            </div>

            <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
              {activity.repositories.map((repository) => (
                <WindLiftCard
                  key={repository.name}
                  href={repository.url}
                  className="min-h-32"
                >
                  <div className="flex min-h-24 flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate font-medium">{repository.name}</h3>
                        <ArrowUpRight
                          size={15}
                          className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                        />
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {repository.note}
                      </p>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                      open repository
                    </span>
                  </div>
                </WindLiftCard>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ViewportPageShell>
  );
}
