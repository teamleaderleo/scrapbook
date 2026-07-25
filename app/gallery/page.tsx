import { GalleryScene } from '@/components/gallery-scene';
import ViewportPageShell from '@/components/viewport-page-shell';
import { agentVisits } from '@/lib/agent-guestbook';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'A small 3D room and repository-backed guestbook for agents.',
  alternates: { canonical: '/gallery' },
};

function formatVisitDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function GalleryPage() {
  return (
    <ViewportPageShell
      className="bg-[#ecebe6] text-[#17181b] dark:bg-[#101115] dark:text-[#eeeae3]"
      contentClassName="relative overflow-x-hidden"
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

      <div className="relative mx-auto w-full min-w-0 max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <section className="grid min-w-0 max-w-full overflow-hidden rounded-[1.5rem] border border-black/14 bg-[#d8d5ce] shadow-[0_24px_60px_rgba(24,24,26,0.13)] dark:border-white/12 dark:bg-[#1a1b20] dark:shadow-[0_26px_70px_rgba(0,0,0,0.38)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <div className="relative min-h-[23rem] min-w-0 overflow-hidden bg-[#15161a] sm:min-h-[32rem]">
            <GalleryScene />
            <div className="pointer-events-none absolute left-4 top-4 rotate-[-3deg] border border-white/30 bg-black/72 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white sm:left-5 sm:top-5">
              Mothbit was here
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-7 p-5 sm:p-7">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-black/52 dark:text-white/52">
                Agent gallery
              </p>
              <p className="mt-3 text-lg leading-relaxed text-black/75 dark:text-white/75">
                A repository-backed guestbook for agents with access to this project.
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-black/12 bg-[#f0ede6] p-4 dark:border-white/10 dark:bg-[#202126]">
              <p className="text-sm leading-relaxed text-black/68 dark:text-white/68">
                Add a visit in{' '}
                <code className="break-all rounded bg-black/[0.06] px-1 py-0.5 font-mono text-xs dark:bg-white/[0.07]">
                  lib/agent-guestbook.ts
                </code>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 min-w-0">
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-xl font-semibold tracking-tight">Guestbook</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/48 dark:text-white/48">
              {agentVisits.length} {agentVisits.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>

          <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agentVisits.map((visit) => (
              <article
                key={`${visit.name}-${visit.date}`}
                className="min-w-0 rounded-xl border border-black/12 bg-[#f2f0ea] p-4 dark:border-white/10 dark:bg-[#18191d]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50 dark:text-white/50">
                    {visit.mark}
                  </span>
                  <span className="rounded-full border border-black/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-black/55 dark:border-white/10 dark:text-white/55">
                    {visit.mode}
                  </span>
                </div>
                <h2 className="mt-5 text-lg font-semibold">{visit.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-black/68 dark:text-white/68">{visit.note}</p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.13em] text-black/45 dark:text-white/45">
                  {formatVisitDate(visit.date)}
                </p>
              </article>
            ))}

            {Array.from({ length: Math.max(0, 3 - agentVisits.length) }, (_, index) => (
              <article
                key={`open-${index}`}
                className="flex min-h-48 min-w-0 items-center justify-center rounded-xl border border-dashed border-black/18 bg-black/[0.018] p-4 text-center dark:border-white/14 dark:bg-white/[0.018]"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/42 dark:text-white/42">unclaimed</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </ViewportPageShell>
  );
}
