import type { Metadata } from 'next';
import Link from 'next/link';
import { PracticeWorkspace } from '@/components/space/practice-workspace';
import { getConceptExercises } from '@/lib/concept-practice-data';
import { Suspense } from 'react';
import ViewportPageShell from '@/components/viewport-page-shell';

export const metadata: Metadata = {
  title: 'Practice · Scrapbook',
  description:
    'Practise code and technical concepts, recall what you learned, and track your progress.',
  alternates: { canonical: '/practice' },
};

export default async function PracticePage() {
  const concepts = await getConceptExercises();
  return (
    <ViewportPageShell className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-serif text-3xl tracking-tight">Practice</h1>
          <Link
            href="/space/trail"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Study trail →
          </Link>
        </header>
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Loading practice…</p>
          }
        >
          <PracticeWorkspace concepts={concepts} />
        </Suspense>
      </div>
    </ViewportPageShell>
  );
}
