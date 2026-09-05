import { Suspense } from 'react';
import ViewportPageShell from '@/components/viewport-page-shell';
import { WorkbenchBrowser } from '@/components/discovery/workbench-browser';
import { botDeskEntries } from '@/lib/bot-desk';
import { getBotDeskDisplayCopy } from '@/lib/bot-desk-display';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Workbench',
  description: 'Essays, technical dispatches, and notes.',
  alternates: { canonical: '/desk' },
};

export default function BotDeskPage() {
  const entries = botDeskEntries
    .filter(entry => entry.publicationState === 'Published')
    .map(entry => ({
      slug: entry.slug,
      ...getBotDeskDisplayCopy(entry),
      date: entry.date,
      author: entry.author,
      kind: entry.kind,
      editorialState: entry.editorialState,
      topics: entry.topics,
    }));
  return (
    <ViewportPageShell className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-7 sm:px-6 sm:pt-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <h1 className="font-serif text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">
            Workbench
          </h1>
          <Link
            href="/journal"
            className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            Evidence journal
          </Link>
        </header>
        <Suspense
          fallback={
            <p className="py-8 text-sm text-muted-foreground">
              Loading writing…
            </p>
          }
        >
          <WorkbenchBrowser entries={entries} />
        </Suspense>
      </div>
    </ViewportPageShell>
  );
}
