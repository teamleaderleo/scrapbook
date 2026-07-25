import { ActivityGrid } from '@/components/home/activity-grid';
import { ActivityScoreboard } from '@/components/home/activity-scoreboard';
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
        className="pointer-events-none absolute inset-0 opacity-55 dark:opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#d7d1df]/50 blur-3xl dark:bg-[#29262f]/45" />
        <div className="absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-[#d9d6cf]/75 blur-3xl dark:bg-[#1b1c20]/70" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <ActivityScoreboard
            today={activity.today}
            weekTotal={activity.weekTotal}
            yearTotal={activity.total}
          />

          <ActivityGrid days={days} unit={unit} />

          <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {activity.repositories.map((repository) => (
              <Link
                key={repository.name}
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 items-center justify-between gap-4 rounded-xl border border-black/12 bg-[#f2f0ea]/68 px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-[#f7f4ed] dark:border-white/10 dark:bg-[#18191d]/85 dark:hover:border-white/22 dark:hover:bg-[#1d1e23]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{repository.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-black/48 dark:text-white/45">
                    {repository.description ?? `github.com/${activity.username}/${repository.name}`}
                  </span>
                </span>
                <ArrowUpRight size={15} className="shrink-0 text-black/35 transition group-hover:text-black/70 dark:text-white/35 dark:group-hover:text-white/75" />
              </Link>
            ))}
          </section>
        </div>
      </div>
    </ViewportPageShell>
  );
}
