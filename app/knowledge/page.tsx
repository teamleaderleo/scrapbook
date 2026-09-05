import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import ViewportPageShell from '@/components/viewport-page-shell';
import { MarkdownContent } from '@/components/space/markdown-content';
import { KnowledgeBrowser } from '@/components/discovery/knowledge-browser';
import {
  getKnowledgeHandoff,
  getKnowledgeIndex,
  getKnowledgeReadingPath,
} from '@/lib/knowledge';

export const metadata: Metadata = {
  title: 'Knowledge',
  description:
    'A linked technical atlas grown from reading, work, and conversation.',
  alternates: { canonical: '/knowledge' },
};

export default async function KnowledgePage() {
  const [index, handoff] = await Promise.all([
    getKnowledgeIndex(),
    getKnowledgeHandoff(),
  ]);
  const readingPath = getKnowledgeReadingPath(handoff.markdown);
  const latestLog = index.logs[0];
  return (
    <ViewportPageShell className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-7 sm:px-6 sm:pt-10 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <h1 className="text-5xl font-bold tracking-[-0.05em] sm:text-7xl">
            Knowledge
          </h1>
          {latestLog && (
            <Link
              href={`/knowledge/${latestLog.slug}`}
              className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground underline underline-offset-4"
            >
              Learning log · {latestLog.date}
            </Link>
          )}
        </header>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Suspense
            fallback={
              <p className="py-8 text-sm text-muted-foreground">
                Loading concepts…
              </p>
            }
          >
            <KnowledgeBrowser trunks={index.trunks} />
          </Suspense>
          <aside className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            {readingPath.length > 0 && (
              <section aria-label="Suggested reading">
                <h2 className="text-sm font-semibold">Suggested reading</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm marker:text-muted-foreground">
                  {readingPath.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-[44px] items-center py-2 hover:underline underline-offset-4"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <details className="mt-4 border-t border-border pt-1">
              <summary className="cursor-pointer py-3 text-sm text-muted-foreground">
                Session notes{handoff.updated ? ` · ${handoff.updated}` : ''}
              </summary>
              <MarkdownContent
                html={handoff.html}
                className="prose prose-sm mt-2 max-w-none dark:prose-invert prose-headings:text-base prose-a:underline-offset-4"
              />
            </details>
          </aside>
        </div>
      </div>
    </ViewportPageShell>
  );
}
