import { RememberVisit } from '@/components/discovery/recent-items';
import { parseMarkdown } from '@/app/lib/utils/markdown';
import { PageCurl, StitchedRule } from '@/components/cozy-flourishes';
import { MarkdownContent } from '@/components/space/markdown-content';
import {
  getReadableLearningRecord,
  getReadableLearningRecordById,
  publicLearningRecords,
} from '@/lib/learning-records';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type LearningRecordPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return publicLearningRecords.map(record => ({ slug: record.slug }));
}

export async function generateMetadata({
  params,
}: LearningRecordPageProps): Promise<Metadata> {
  const { slug } = await params;
  const record = getReadableLearningRecord(slug);
  if (!record) return { title: 'Learning record not found' };
  return {
    title: `${record.title} · Space`,
    description: record.spark,
    alternates: { canonical: record.canonicalUrl },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default async function LearningRecordPage({
  params,
}: LearningRecordPageProps) {
  const { slug } = await params;
  const record = getReadableLearningRecord(slug);
  if (!record) notFound();
  const explanationHtml = await parseMarkdown(record.explanation);

  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-background px-3 py-3 text-foreground sm:px-6 sm:py-6">
      {record.visibility === 'public' && (
        <RememberVisit href={record.canonicalUrl} />
      )}
      <div className="mx-auto mb-3 flex min-h-11 w-full max-w-4xl items-center justify-between gap-3">
        <Link
          href="/space/records"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Living records
        </Link>
        <span className="max-w-[45vw] truncate font-mono text-[9px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
          {record.id}
        </span>
      </div>

      <div>
        <article className="material-paper relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border shadow-[0_20px_55px_rgba(38,33,27,0.12)] dark:shadow-[0_20px_55px_rgba(0,0,0,0.34)]">
          <header className="px-5 pb-6 pt-6 sm:px-9 sm:pb-8 sm:pt-9">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--material-paper-ink)/0.56)]">
              <span>{record.mode}</span>
              <span aria-hidden="true">·</span>
              <span>{record.visibility}</span>
              <span aria-hidden="true">·</span>
              <span>schema v{record.schemaVersion}</span>
            </div>
            <h1 className="mt-4 max-w-[24ch] text-balance text-3xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl">
              {record.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-[hsl(var(--material-paper-ink)/0.76)] sm:text-lg sm:leading-8">
              {record.spark}
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {record.topics.map(topic => (
                <span
                  key={topic}
                  className="rounded-full border border-[hsl(var(--material-paper-edge)/0.7)] bg-[hsl(var(--material-paper-face)/0.55)] px-2.5 py-1 text-[10px] leading-4 text-[hsl(var(--material-paper-ink)/0.68)]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </header>

          <StitchedRule className="mx-5 sm:mx-9" />

          <div className="divide-y divide-dashed divide-[hsl(var(--material-paper-edge)/0.65)]">
            <section className="px-5 py-7 sm:px-9 sm:py-9">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[hsl(var(--material-paper-ink)/0.5)]">
                Current explanation
              </p>
              <MarkdownContent
                html={explanationHtml}
                className="prose prose-stone mt-4 max-w-[68ch] prose-p:leading-7 dark:prose-invert sm:prose-base"
              />
            </section>

            <section className="px-5 py-7 sm:px-9 sm:py-9">
              <h2 className="text-xl font-black tracking-[-0.025em]">
                Lesson path
              </h2>
              <ol className="mt-4 grid gap-3">
                {record.lessonPlan.map((step, index) => (
                  <li
                    key={step.id}
                    className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-[hsl(var(--material-paper-edge)/0.65)] pt-3"
                  >
                    <span className="font-mono text-[9px] tabular-nums text-[hsl(var(--material-paper-ink)/0.45)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        <span className="rounded-full border border-[hsl(var(--material-paper-edge)/0.65)] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[hsl(var(--material-paper-ink)/0.55)]">
                          {step.state}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[hsl(var(--material-paper-ink)/0.7)]">
                        {step.prompt}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {record.questions.length || record.selectedQas.length ? (
              <section className="grid gap-7 px-5 py-7 sm:px-9 sm:py-9 lg:grid-cols-2">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.025em]">
                    Open questions
                  </h2>
                  <ul className="mt-3 divide-y divide-[hsl(var(--material-paper-edge)/0.65)] border-y border-[hsl(var(--material-paper-edge)/0.65)]">
                    {record.questions.map(question => (
                      <li key={question.id} className="py-3 text-sm leading-6">
                        {question.prompt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-[-0.025em]">
                    Selected Q&A
                  </h2>
                  <div className="mt-3 divide-y divide-[hsl(var(--material-paper-edge)/0.65)] border-y border-[hsl(var(--material-paper-edge)/0.65)]">
                    {record.selectedQas.map(qa => (
                      <details key={qa.id} className="group py-3">
                        <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-semibold leading-6 underline decoration-[hsl(var(--material-paper-edge))] underline-offset-4 marker:content-none">
                          {qa.question}
                        </summary>
                        <p className="pb-2 text-sm leading-6 text-[hsl(var(--material-paper-ink)/0.72)]">
                          {qa.answer}
                        </p>
                        {qa.curation ? (
                          <p className="pb-2 font-mono text-[8px] font-semibold uppercase tracking-[0.11em] text-[hsl(var(--material-paper-ink)/0.48)]">
                            Owner-selected excerpt · raw transcript stays
                            private
                          </p>
                        ) : null}
                      </details>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <section className="grid gap-7 px-5 py-7 sm:px-9 sm:py-9 lg:grid-cols-2">
              <div>
                <h2 className="text-xl font-black tracking-[-0.025em]">
                  Next actions
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                  {record.nextActions.map(action => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-black tracking-[-0.025em]">
                  Sources
                </h2>
                <ul className="mt-3 divide-y divide-[hsl(var(--material-paper-edge)/0.65)] border-y border-[hsl(var(--material-paper-edge)/0.65)]">
                  {record.sources.map(item => (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex min-h-11 items-center justify-between gap-3 py-2.5 text-sm font-semibold underline decoration-transparent underline-offset-4 hover:decoration-current"
                      >
                        <span>{item.title}</span>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-[hsl(var(--material-paper-ink)/0.5)]"
                          aria-hidden="true"
                        />
                      </a>
                      <p className="pb-3 text-xs leading-5 text-[hsl(var(--material-paper-ink)/0.62)]">
                        {item.note}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="grid gap-7 px-5 py-7 sm:px-9 sm:py-9 lg:grid-cols-2">
              <div>
                <h2 className="text-xl font-black tracking-[-0.025em]">
                  Revision trail
                </h2>
                <ol className="mt-3 space-y-3">
                  {[...record.revisions].reverse().map(revisionItem => (
                    <li
                      key={revisionItem.id}
                      className="border-l-2 border-[hsl(var(--material-paper-edge))] pl-3"
                    >
                      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[hsl(var(--material-paper-ink)/0.5)]">
                        <time dateTime={revisionItem.createdAt}>
                          {formatDate(revisionItem.createdAt)}
                        </time>{' '}
                        · {revisionItem.id}
                      </p>
                      <p className="mt-1 text-sm leading-6">
                        {revisionItem.summary}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h2 className="text-xl font-black tracking-[-0.025em]">
                  Related records
                </h2>
                <ul className="mt-3 divide-y divide-[hsl(var(--material-paper-edge)/0.65)] border-y border-[hsl(var(--material-paper-edge)/0.65)]">
                  {record.relations.map(edge => {
                    const target = getReadableLearningRecordById(edge.targetId);
                    if (!target) return null;
                    return (
                      <li key={`${edge.type}:${edge.targetId}`}>
                        <Link
                          href={target.canonicalUrl}
                          prefetch
                          className="block min-h-11 py-3"
                        >
                          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--material-paper-ink)/0.5)]">
                            {edge.type}
                          </span>
                          <span className="mt-1 block text-sm font-semibold underline decoration-[hsl(var(--material-paper-edge))] underline-offset-4">
                            {target.title}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-[hsl(var(--material-paper-ink)/0.62)]">
                            {edge.reason}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </div>

          <PageCurl className="h-10 w-10 opacity-70 [&>span]:h-10 [&>span]:w-10" />
          <span className="material-paper-edge" aria-hidden="true" />
        </article>
      </div>
    </div>
  );
}
