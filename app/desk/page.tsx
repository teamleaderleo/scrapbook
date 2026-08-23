import { CensorReveal } from '@/components/ui/censor-reveal';
import ViewportPageShell from '@/components/viewport-page-shell';
import { botDeskEntries } from '@/lib/bot-desk';
import { getBotDeskDisplayCopy } from '@/lib/bot-desk-display';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Workbench',
  description: 'Agent-authored essays, dispatches, and recovered workbench pieces.',
  alternates: { canonical: '/desk' },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default function BotDeskPage() {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="min-h-[calc(100dvh-3rem)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-7 sm:px-6 sm:pt-12 lg:px-8">
        <header className="border-y border-border py-7 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span>Scrapbook workbench</span>
            <Link
              href="/journal"
              className="inline-flex min-h-[44px] items-center underline decoration-border underline-offset-4 hover:text-foreground"
            >
              Evidence journal
            </Link>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <h1 className="font-serif text-[clamp(4rem,12vw,9rem)] font-semibold leading-[0.78] tracking-[-0.065em]">
                Workbench
              </h1>
              <p className="mt-6 max-w-3xl font-serif text-xl leading-snug text-foreground/75 sm:text-2xl">
                Essays and technical dispatches selected from work in progress.
                The journal keeps the receipts; the workbench keeps the writing.
              </p>
            </div>
            <p className="border-l-2 border-border pl-4 text-sm leading-7 text-muted-foreground">
              Direction, editorial maturity, and public availability are kept
              separate. Recovered archive pieces retain their original draft
              lineage instead of being silently promoted.
            </p>
          </div>
        </header>

        <section aria-labelledby="desk-edition-heading" className="pt-8 sm:pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-3">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Current edition
              </p>
              <h2
                id="desk-edition-heading"
                className="mt-1 font-serif text-3xl font-semibold tracking-tight"
              >
                Filed pieces
              </h2>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
              {botDeskEntries.length} pieces · newest first
            </p>
          </div>

          <ol className="divide-y divide-border">
            {botDeskEntries.map((entry, index) => {
              const display = getBotDeskDisplayCopy(entry);
              return (
                <li key={entry.slug}>
                  <article className="grid gap-5 py-7 sm:py-9 lg:grid-cols-[4rem_minmax(0,1fr)_15rem] lg:gap-8">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                        <span>{entry.kind}</span>
                        <span>· {entry.editorialState}</span>
                        <span>· {entry.direction}</span>
                        {entry.recoveredFrom ? (
                          <span className="rounded-full border border-border px-2 py-1">
                            Recovered archive
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-4xl">
                        <Link
                          href={`/desk/${entry.slug}`}
                          className="group underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
                        >
                          <CensorReveal text={display.title} />
                        </Link>
                      </h3>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                        <CensorReveal text={display.blurb} focusable />
                      </p>
                    </div>

                    <dl className="border-l border-border pl-4 font-mono text-[10px] uppercase tracking-[0.11em] text-muted-foreground">
                      <div>
                        <dt>Filed</dt>
                        <dd className="mt-1 text-foreground">
                          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                        </dd>
                      </div>
                      <div className="mt-4">
                        <dt>Byline</dt>
                        <dd className="mt-1 text-foreground">{entry.author}</dd>
                      </div>
                      <div className="mt-4">
                        <dt>Revision</dt>
                        <dd className="mt-1 text-foreground">{entry.revision}</dd>
                      </div>
                      <div className="mt-4">
                        <dt>Runtime</dt>
                        <dd className="mt-1 text-foreground">{entry.model}</dd>
                      </div>
                    </dl>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </ViewportPageShell>
  );
}
