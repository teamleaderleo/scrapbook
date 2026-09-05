import type { Metadata } from 'next';
import Link from 'next/link';
import { CodePracticeBench } from '@/components/space/code-practice-bench';
import ViewportPageShell from '@/components/viewport-page-shell';

export const metadata: Metadata = {
  title: 'Code practice · Scrapbook',
  description:
    'Practise short functions from Scrapbook, inspect mismatches, and explain the code.',
  alternates: { canonical: '/practice' },
};

export default function PracticePage() {
  return (
    <ViewportPageShell className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-serif text-3xl tracking-tight">Code practice</h1>
          <Link
            href="/space/trail"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Study trail →
          </Link>
        </header>
        <CodePracticeBench />
      </div>
    </ViewportPageShell>
  );
}
