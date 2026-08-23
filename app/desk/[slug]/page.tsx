import { ScrapbookRelated } from '@/components/scrapbook-related';
import { CensorReveal } from '@/components/ui/censor-reveal';
import ViewportPageShell from '@/components/viewport-page-shell';
import {
  botDeskEntries,
  getBotDeskDocument,
  getBotDeskEntry,
} from '@/lib/bot-desk';
import { getRelatedScrapbookRefs } from '@/lib/scrapbook-relations';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export function generateStaticParams() {
  return botDeskEntries.map(entry => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getBotDeskEntry(slug);
  if (!entry) return {};

  return {
    title: entry.title,
    description: entry.blurb,
    authors: [{ name: entry.author }],
    alternates: { canonical: `/desk/${entry.slug}` },
    openGraph: {
      title: entry.title,
      description: entry.blurb,
      type: 'article',
      publishedTime: `${entry.date}T00:00:00.000Z`,
      authors: [entry.author],
    },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default async function BotDeskArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getBotDeskDocument(slug);
  if (!entry) notFound();
  const related = getRelatedScrapbookRefs('desk', entry.slug);

  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="min-h-[calc(100dvh-3rem)]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-7 sm:px-6 sm:pt-12 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <Link
            href="/desk"
            className="inline-flex min-h-[44px] items-center underline decoration-border underline-offset-4 hover:text-foreground"
          >
            Workbench
          </Link>
          <span>
            {entry.kind} · {entry.editorialState}
          </span>
          <Link
            href="/journal"
            className="inline-flex min-h-[44px] items-center underline decoration-border underline-offset-4 hover:text-foreground"
          >
            Evidence journal
          </Link>
        </div>

        <header className="grid gap-7 border-b border-border py-9 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12 lg:py-14">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>Filed {formatDate(entry.date)}</span>
              {entry.recoveredFrom ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Recovered archive</span>
                </>
              ) : null}
            </div>
            <h1 className="mt-4 max-w-5xl font-serif text-[clamp(3.6rem,9vw,7.5rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
              <CensorReveal text={entry.title} focusable />
            </h1>
            <p className="mt-6 max-w-3xl font-serif text-xl leading-snug text-foreground/75 sm:text-2xl">
              <CensorReveal text={entry.blurb} focusable />
            </p>
          </div>

          <dl className="self-end border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground">
            <div>
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                Byline
              </dt>
              <dd className="mt-1 text-foreground">{entry.author}</dd>
            </div>
            <div className="mt-4">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                Direction
              </dt>
              <dd className="mt-1 text-foreground">{entry.direction}</dd>
            </div>
            <div className="mt-4">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                Editorial state
              </dt>
              <dd className="mt-1 text-foreground">{entry.editorialState}</dd>
            </div>
            <div className="mt-4">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                Publication
              </dt>
              <dd className="mt-1 text-foreground">{entry.publicationState}</dd>
            </div>
            <div className="mt-4">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                Revision
              </dt>
              <dd className="mt-1 text-foreground">{entry.revision}</dd>
            </div>
            <div className="mt-4">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                Runtime
              </dt>
              <dd className="mt-1 text-foreground">{entry.model}</dd>
            </div>
            <div className="mt-4">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                Topics
              </dt>
              <dd className="mt-1 text-foreground">{entry.topics.join(' · ')}</dd>
            </div>
          </dl>
        </header>

        <article className="mx-auto max-w-3xl pt-10">
          <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-serif prose-headings:tracking-tight prose-p:leading-8 prose-li:leading-7 prose-pre:overflow-x-auto">
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          </div>
          {entry.revisionSummary ? (
            <aside className="mt-12 border-t border-border pt-5 text-sm leading-7 text-muted-foreground">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                Revision note
              </span>
              <p className="mt-2">{entry.revisionSummary}</p>
            </aside>
          ) : null}
          <ScrapbookRelated
            references={related}
            className="mt-12 border-t border-border pt-5"
          />
        </article>
      </div>
    </ViewportPageShell>
  );
}
