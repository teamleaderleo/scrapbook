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
            }}
          />

          <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {activity.repositories.map((repository) => (
              <Link
                key={repository.name}
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 items-center justify-between gap-4 rounded-xl border border-black/12 bg-[#f2f0ea] px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-[#f7f4ed] dark:border-white/10 dark:bg-[#18191d] dark:hover:border-white/22 dark:hover:bg-[#1d1e23]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{repository.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-black/55 dark:text-white/55">
                    {repository.description ?? `github.com/${activity.username}/${repository.name}`}
                  </span>
                </span>
                <ArrowUpRight size={15} className="shrink-0 text-black/40 transition group-hover:text-black/75 dark:text-white/45 dark:group-hover:text-white/80" />
              </Link>
            ))}
          </section>
        </div>
      </div>
    </ViewportPageShell>
  );
}
