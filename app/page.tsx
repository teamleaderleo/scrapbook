import { ActivityDashboard } from '@/components/home/activity-dashboard';
import ViewportPageShell from '@/components/viewport-page-shell';
import { getGitHubHomeData } from '@/lib/github-home';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Leo · GitHub activity',
  description: 'Recent public GitHub activity from teamleaderleo.',
  alternates: { canonical: '/' },
};

export default async function Page() {
  const activity = await getGitHubHomeData();
  const unit = activity.source === 'public-events' ? 'public actions' : 'contributions';
  const days = activity.days.slice(-28);

  return (
    <ViewportPageShell
      className="relative bg-[#ecebe6] text-[#17181b] dark:bg-[#101115] dark:text-[#eeeae3]"
      contentClassName="relative overflow-x-hidden text-inherit"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-18"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <ActivityDashboard
            initial={{
              today: activity.today,
              weekTotal: activity.weekTotal,
              yearTotal: activity.total,
              days,
              unit,
              generatedAt: activity.generatedAt,
            }}
          />

          <section aria-labelledby="recent-systems-title" className="min-w-0">
            <div className="flex items-end justify-between gap-4 px-0.5">
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-black/48 dark:text-white/48">
                  Recent systems
                </p>
                <h2 id="recent-systems-title" className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                  Tools that remember their boundaries
                </h2>
              </div>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-black/42 dark:text-white/42">
                {activity.repositories.length} projects
              </span>
            </div>

            <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
              {activity.repositories.map((repository) => (
                <Link
                  key={repository.name}
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-36 min-w-0 flex-col justify-between gap-5 rounded-xl border border-black/12 bg-[#f2f0ea] p-4 transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-[#f7f4ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/35 dark:border-white/10 dark:bg-[#18191d] dark:hover:border-white/22 dark:hover:bg-[#1d1e23] dark:focus-visible:ring-white/45"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate font-medium">{repository.name}</h3>
                      <ArrowUpRight
                        size={15}
                        className="shrink-0 text-black/40 transition group-hover:text-black/75 dark:text-white/45 dark:group-hover:text-white/80"
                      />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-black/62 dark:text-white/62">
                      {repository.note}
                    </p>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-black/42 dark:text-white/42">
                    open repository
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ViewportPageShell>
  );
}
