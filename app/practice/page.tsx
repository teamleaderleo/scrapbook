import type { Metadata } from 'next';
import Link from 'next/link';
import { PracticeWorkspace } from '@/components/space/practice-workspace';
import { getConceptExercises } from '@/lib/concept-practice-data';
import { Suspense } from 'react';
import ViewportPageShell from '@/components/viewport-page-shell';
import styles from '@/components/space/practice.module.css';
import { PracticeBotanical } from '@/components/space/practice-botanical';
import { getPracticeAppearance } from '@/lib/practice-syntax';
import { PracticeAppearance, PracticeThemePicker } from '@/components/space/practice-appearance';

export const metadata: Metadata = {
  title: 'Practice · Scrapbook',
  description:
    'Practise code and technical concepts, recall what you learned, and track your progress.',
  alternates: { canonical: '/practice' },
};

export default async function PracticePage() {
  const [concepts, appearance] = await Promise.all([getConceptExercises(), getPracticeAppearance()]);
  return (
    <PracticeAppearance data={appearance}>
    <ViewportPageShell className="bg-background text-foreground">
      <div
        className={`${styles.garden} mx-auto w-full max-w-5xl px-5 py-7 sm:px-10 sm:py-10`}
      >
        <PracticeBotanical className={styles.branch} />
        <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PracticeBotanical className={styles.sprig} />
            <h1 className="font-serif text-4xl tracking-tight">Practice</h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <PracticeThemePicker />
          <Link
            href="/space/trail"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Study trail →
          </Link>
          </div>
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
    </PracticeAppearance>
  );
}
