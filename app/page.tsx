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
      className="relative bg-[#dedbd3] text-[#1b1b1e] dark:bg-[#111216] dark:text-[#f0ece5]"
      contentClassName="relative overflow-x-hidden text-inherit"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-16"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-7">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
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

          <section aria-labelledby="recent-systems-title" className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-4 px-0.5">
              <h2
                id="recent-systems-title"
                className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-black/58 dark:text-white/62"
              >
                Recent systems
              </h2>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-black/52 dark:text-white/56">
                {activity.repositories.length} projects
              </span>
            </div>

            <div className="mt-3 grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-3">
              {activity.repositories.map((repository) => (
                <Link
                  key={repository.name}
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-40 min-w-0 flex-col justify-between gap-5 rounded-xl border border-black/14 bg-[#e4e0d7] p-4 shadow-[0_8px_20px_rgba(24,24,26,0.05)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:border-black/28 hover:bg-[#e9e5dc] hover:shadow-[0_16px_30px_rgba(24,24,26,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:border-white/14 dark:bg-[#1b1c21] dark:shadow-[0_10px_24px_rgba(0,0,0,0.18)] dark:hover:border-white/28 dark:hover:bg-[#24252b] dark:hover:shadow-[0_18px_34px_rgba(0,0,0,0.32)] dark:focus-visible:ring-white/55"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate font-medium text-black/88 dark:text-white/92">{repository.name}</h3>
                      <ArrowUpRight
                        size={15}
                        className="shrink-0 text-black/48 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-black/82 dark:text-white/55 dark:group-hover:text-white/88"
                      />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-black/68 dark:text-white/72">
                      {repository.note}
                    </p>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-black/52 dark:text-white/56">
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
