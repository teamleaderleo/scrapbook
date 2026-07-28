import { ActivityDashboard } from '@/components/home/activity-dashboard';
import { WindLiftCard } from '@/components/home/wind-lift-card';
import ViewportPageShell from '@/components/viewport-page-shell';
import { getGitHubHomeData } from '@/lib/github-home';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'Leo · GitHub activity',
  description: 'Recent GitHub profile contributions from teamleaderleo.',
  alternates: { canonical: '/' },
};

const repositoryNoteOverrides: Record<string, string> = {
  smolrunner: 'Plans host work before changing anything and inspects unknown state first.',
};

export default async function Page() {
  await connection();
  const activity = await getGitHubHomeData();
  const days = activity.days.slice(-35);
  const yearTotal = activity.periodLabel === 'last year' ? activity.total : null;

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

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl flex-col justify-start px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <ActivityDashboard
            initial={{
              today: activity.today,
              weekTotal: activity.weekTotal,
              yearTotal,
              days,
              unit: 'contributions',
              generatedAt: activity.generatedAt,
            }}
          />

          <section aria-label="Recent systems" className="min-w-0" data-recent-systems>
            <div className="flex items-center justify-between gap-4 px-0.5">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
                Recent systems
              </p>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                {activity.repositories.length} projects
              </span>
            </div>

            <div className="mt-2.5 grid min-w-0 grid-cols-1 gap-2.5 md:grid-cols-3">
              {activity.repositories.map((repository) => (
                <WindLiftCard
                  key={repository.name}
                  href={repository.url}
                  className="min-h-28 p-3.5"
                >
                  <div className="flex min-h-20 flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate font-medium">{repository.name}</h3>
                        <ArrowUpRight
                          size={15}
                          className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                        />
                      </div>
                      <p className="mt-2 text-sm leading-snug text-muted-foreground">
                        {repositoryNoteOverrides[repository.name] ?? repository.note}
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
