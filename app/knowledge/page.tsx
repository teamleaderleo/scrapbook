import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, GitBranch, Sprout } from 'lucide-react';
import ViewportPageShell from '@/components/viewport-page-shell';
import { getKnowledgeIndex } from '@/lib/knowledge';

export const metadata: Metadata = {
  title: 'Knowledge',
  description: 'A linked technical atlas grown from reading, work, and conversation.',
  alternates: { canonical: '/knowledge' },
};

function activity(entry: {
  newCount?: number;
  strengthenedCount?: number;
  linkedCount?: number;
}) {
  return [
    `${entry.newCount ?? 0} new`,
    `${entry.strengthenedCount ?? 0} strengthened`,
    `${entry.linkedCount ?? 0} links`,
  ].join(' · ');
}

export default async function KnowledgePage() {
  const index = await getKnowledgeIndex();
  const latestLog = index.logs[0];

  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="min-h-[calc(100dvh-3rem)]"
    >
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-7 sm:px-6 sm:pt-10 lg:px-8">
        <header className="grid gap-7 border-y border-border py-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)] lg:items-end lg:py-10">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Repository-backed technical atlas
            </p>
            <h1 className="mt-3 text-[clamp(3.4rem,10vw,7.5rem)] font-black leading-[0.84] tracking-[-0.065em]">
              Knowledge
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-foreground/78 sm:text-xl">
              Concepts grow here through reading, conversation, and real work.
              The folders help us find things; the links are where the forest
              gets interesting.
            </p>
          </div>

          <div className="border-l-2 border-border pl-4 text-sm leading-7 text-muted-foreground">
            <p>
              {index.concepts.length} concept nodes across {index.trunks.length}{' '}
              trunks. Markdown is canonical; Git keeps the revision history.
            </p>
            {latestLog ? (
              <Link
                href={`/knowledge/${latestLog.slug}`}
                className="mt-3 inline-flex min-h-11 items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                Latest · {latestLog.date ?? latestLog.title}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </header>

        {latestLog ? (
          <section className="mt-7 grid gap-3 border-y border-border py-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
              <Sprout className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Latest activity · {latestLog.date ?? latestLog.title}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground/78">
                {activity(latestLog)}
              </p>
            </div>
          </section>
        ) : null}

        <section className="pt-8" aria-labelledby="knowledge-trunks-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Trunks
              </p>
              <h2 id="knowledge-trunks-title" className="mt-1 text-2xl font-black tracking-[-0.03em]">
                Ways into the forest
              </h2>
            </div>
            <GitBranch className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {index.trunks.map(trunk => (
              <article
                key={trunk.slug}
                className="material-paper relative overflow-hidden rounded-2xl border p-5 shadow-[0_14px_30px_rgba(38,33,27,0.08)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.22)]"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-bold tracking-[-0.025em]">
                    <Link
                      href={`/knowledge/${trunk.slug}`}
                      className="underline decoration-transparent underline-offset-4 hover:decoration-current"
                    >
                      {trunk.title}
                    </Link>
                  </h3>
                  <span className="font-mono text-[9px] uppercase tracking-[0.11em] text-muted-foreground">
                    {trunk.nodes.length} nodes
                  </span>
                </div>

                {trunk.summary ? (
                  <p className="mt-3 text-sm leading-6 text-foreground/68">
                    {trunk.summary}
                  </p>
                ) : null}

                <ul className="mt-5 divide-y divide-border border-y border-border">
                  {trunk.nodes.slice(0, 5).map(node => (
                    <li key={node.slug}>
                      <Link
                        href={`/knowledge/${node.slug}`}
                        className="group flex min-h-11 items-center justify-between gap-3 py-2 text-sm font-medium"
                      >
                        <span className="text-foreground/78 group-hover:text-foreground">
                          {node.title}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
    </ViewportPageShell>
  );
}
