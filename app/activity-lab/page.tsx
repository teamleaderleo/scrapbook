import { ActivityFieldLab } from '@/components/labs/activity-field-lab';
import ViewportPageShell from '@/components/viewport-page-shell';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Activity geometry lab · Scrapbook',
  description: 'An isolated comparison of square, honeycomb, and stepped activity fields.',
  robots: { index: false, follow: false },
};

export default function ActivityLabPage() {
  return (
    <ViewportPageShell
      className="relative bg-background text-foreground"
      contentClassName="relative min-h-[calc(100dvh-3rem)] overflow-x-hidden text-inherit"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-12"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <main className="relative mx-auto w-full max-w-[96rem] px-2 py-5 sm:px-4 sm:py-7 lg:px-6">
        <header className="mx-auto max-w-4xl text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-card px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to homepage
          </Link>
          <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Issue #383 · isolated comparison prototype
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Present-first activity geometry
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            The same 28 chronological days appear three ways. DOM and screen-reader order always run oldest to newest; only the visual coordinates change. Select any day to compare the same state across every candidate.
          </p>
        </header>

        <div className="mt-7">
          <ActivityFieldLab />
        </div>

        <aside className="mx-auto mt-5 max-w-4xl rounded-[1.25rem] border border-border/70 bg-card/80 p-4 text-sm leading-relaxed text-muted-foreground shadow-[0_16px_38px_rgba(35,31,26,0.08)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.24)] sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Provisional recommendation
          </p>
          <p className="mt-2">
            Carry the honeycomb into the later homepage reconciliation. It gives today a clear origin, preserves a predictable path, and occupies less field area than the square control. Keep this route as evidence until the compact homepage work in #389 settles the final surrounding dimensions.
          </p>
        </aside>
      </main>
    </ViewportPageShell>
  );
}
