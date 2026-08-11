import ViewportPageShell from '@/components/viewport-page-shell';
import { workRecords, workRecordUpdatedAt } from '@/lib/work-records';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Selected engineering work: things built, repaired, measured, and reconsidered.',
  alternates: { canonical: '/work' },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default function WorkPage() {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="min-h-[calc(100dvh-3rem)]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-7 sm:px-6 sm:pt-10 lg:px-8">
        <header className="grid gap-7 border-y border-border py-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.6fr)] lg:items-end lg:py-10">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Selected record · updated {formatDate(workRecordUpdatedAt)}
            </p>
            <h1 className="mt-3 text-[clamp(3.5rem,11vw,8rem)] font-black leading-[0.82] tracking-[-0.07em]">
              Work
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-foreground/78 sm:text-xl">
              Things built, repaired, measured, and reconsidered. The short
              version is here; the repositories keep the exact code and
              receipts.
            </p>
          </div>

          <div className="border-l-2 border-border pl-4 text-sm leading-7 text-muted-foreground">
            <p>
              This is a selected public view, not a resume and not an activity
              leaderboard. Useful reversals stay beside the wins.
            </p>
            <a
              href="/api/work"
              className="mt-3 inline-flex min-h-11 items-center font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              Read as JSON
            </a>
          </div>
        </header>

        <div className="grid gap-10 pt-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
          <nav
            aria-label="Work record index"
            className="lg:sticky lg:top-20 lg:self-start"
          >
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Index
            </p>
            <ol className="mt-3 grid grid-cols-2 border-t border-border sm:grid-cols-3 lg:grid-cols-1">
              {workRecords.map((record, index) => (
                <li key={record.id} className="border-b border-border">
                  <a
                    href={`#${record.id}`}
                    className="group flex min-h-11 items-center gap-3 py-2 pr-2 text-sm font-semibold hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="font-mono text-[9px] tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-foreground/78 group-hover:text-foreground">
                      {record.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <ol className="grid min-w-0 gap-12" data-work-records>
            {workRecords.map((record, index) => (
              <li
                key={record.id}
                id={record.id}
                data-work-record={record.id}
                className="scroll-mt-20 border-t border-border pt-5"
              >
                <article aria-labelledby={`work-${record.id}-title`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        {String(index + 1).padStart(2, '0')} · {record.kind}
                      </p>
                      <h2
                        id={`work-${record.id}-title`}
                        className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl"
                      >
                        {record.title}
                      </h2>
                    </div>
                    <span className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                      {record.status}
                    </span>
                  </div>

                  <p className="mt-5 max-w-4xl text-base font-medium leading-7 text-foreground/78 sm:text-lg sm:leading-8">
                    {record.summary}
                  </p>

                  <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
                    <div>
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        What changed
                      </p>
                      <ul className="mt-2 divide-y divide-border border-y border-border">
                        {record.accomplishments.map(accomplishment => (
                          <li
                            key={accomplishment}
                            className="grid grid-cols-[0.7rem_minmax(0,1fr)] gap-3 py-3 text-sm leading-6"
                          >
                            <span
                              aria-hidden="true"
                              className="pt-px text-muted-foreground"
                            >
                              ·
                            </span>
                            <span>{accomplishment}</span>
                          </li>
                        ))}
                      </ul>

                      {record.reversal ? (
                        <aside className="mt-5 border-l-2 border-border pl-4">
                          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                            Useful reversal
                          </p>
                          <p className="mt-2 text-sm leading-6 text-foreground/75">
                            {record.reversal}
                          </p>
                        </aside>
                      ) : null}
                    </div>

                    <aside aria-label={`${record.title} evidence`}>
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        Evidence
                      </p>
                      <ul className="mt-2 divide-y divide-border border-y border-border">
                        {record.evidence.map(evidence => (
                          <li key={evidence.href}>
                            <a
                              href={evidence.href}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex min-h-11 items-center justify-between gap-3 py-2.5 text-sm font-semibold underline decoration-transparent underline-offset-4 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span>{evidence.label}</span>
                              <ArrowUpRight
                                className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                aria-hidden="true"
                              />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </aside>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </ViewportPageShell>
  );
}
