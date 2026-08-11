import { PageCurl, StitchedRule } from '@/components/cozy-flourishes';
import { publicLearningRecords } from '@/lib/learning-records';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Living records · Space',
  description:
    'Revisioned learning records with explanations, questions, selected Q&A, sources, and related ideas.',
  alternates: { canonical: '/space/records' },
};

export default function LearningRecordsPage() {
  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-background px-3 py-4 text-foreground sm:p-6">
      <div className="mx-auto mb-3 flex min-h-11 w-full max-w-6xl items-center justify-between gap-3">
        <Link
          href="/space"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Space
        </Link>
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          {publicLearningRecords.length} public records
        </span>
      </div>

      <div data-learning-record-index>
        <div className="mx-auto w-full max-w-6xl">
          <header className="border-y border-border py-6 sm:py-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Space · repository fixtures · schema v1
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
              Living records
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Topics that can keep changing without losing their earlier shape.
              Each one keeps a short reminder, a current explanation, questions,
              selected answers, sources, revisions, and a few meaningful ways
              onward.
            </p>
          </header>

          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {publicLearningRecords.map((record, index) => (
              <li
                key={record.id}
                id={`record-${record.slug}`}
                className="scroll-mt-16"
              >
                <article className="material-paper relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-[hsl(var(--material-paper-ink)/0.55)]">
                    <span>
                      {String(index + 1).padStart(2, '0')} · {record.mode}
                    </span>
                    <span>
                      {record.revisions.length} revision
                      {record.revisions.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-black leading-tight tracking-[-0.03em]">
                    <Link
                      href={record.canonicalUrl}
                      prefetch
                      className="underline decoration-transparent underline-offset-4 hover:decoration-current"
                    >
                      {record.title}
                    </Link>
                  </h2>
                  <p className="mt-3 text-sm font-medium leading-6 text-[hsl(var(--material-paper-ink)/0.76)]">
                    {record.spark}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {record.topics.slice(0, 3).map(topic => (
                      <span
                        key={topic}
                        className="rounded-full border border-[hsl(var(--material-paper-edge)/0.65)] bg-[hsl(var(--material-paper-face)/0.5)] px-2 py-1 text-[9px] text-[hsl(var(--material-paper-ink)/0.65)]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                  <StitchedRule className="mt-5" />
                  <div className="mt-auto flex items-end justify-between gap-4 pt-4">
                    <span className="font-mono text-[9px] uppercase tracking-[0.11em] text-[hsl(var(--material-paper-ink)/0.48)]">
                      {record.questions.length} open ·{' '}
                      {record.selectedQas.length} Q&A
                    </span>
                    <Link
                      href={record.canonicalUrl}
                      prefetch
                      aria-label={`Read ${record.title}`}
                      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-[hsl(var(--material-paper-edge))] underline-offset-4 hover:decoration-current"
                    >
                      Read
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                  <PageCurl className="h-8 w-8 opacity-55 [&>span]:h-8 [&>span]:w-8" />
                  <span className="material-paper-edge" aria-hidden="true" />
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
