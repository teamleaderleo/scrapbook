import { TactileLabLoader } from '@/components/labs/tactile-lab-loader';
import ViewportPageShell from '@/components/viewport-page-shell';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tactile lab · Scrapbook',
  description: 'An isolated deterministic workshop for rigid and deformable interaction.',
  robots: { index: false, follow: false },
};

export default function TactileLabPage() {
  return (
    <ViewportPageShell
      className="relative bg-background text-foreground"
      contentClassName="relative min-h-[calc(100dvh-3rem)] overflow-x-hidden text-inherit"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <main className="relative mx-auto w-full max-w-[88rem] px-3 py-5 sm:px-5 sm:py-7 lg:px-7">
        <header className="mx-auto max-w-3xl text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-card px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to homepage
          </Link>
          <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Issue #411 · isolated simulation foundation
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Tactile workshop
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            A deterministic fixed-step scene for testing drag, collision, constrained gel, pause behaviour, and performance guardrails without entering ordinary route bundles.
          </p>
        </header>

        <div className="mt-6">
          <TactileLabLoader />
        </div>
      </main>
    </ViewportPageShell>
  );
}
