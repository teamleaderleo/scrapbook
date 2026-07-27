import { AgentSigilLab } from '@/components/labs/agent-sigil-lab';
import ViewportPageShell from '@/components/viewport-page-shell';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Agent sigil lab · Scrapbook',
  description: 'An isolated comparison of deterministic generated identities for agents.',
  robots: { index: false, follow: false },
};

export default function AgentSigilLabPage() {
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

      <main className="relative mx-auto w-full max-w-[96rem] px-3 py-5 sm:px-5 sm:py-7 lg:px-7">
        <header className="mx-auto max-w-4xl text-center">
          <Link
            href="/gallery"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-card px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to gallery
          </Link>
          <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Issue #435 · isolated identity prototype
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Generative sigils for agents
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Each mark is assembled from circles, arcs, petals, rounded tiles, rings, symmetry, overlap, and a seeded palette. The same seed and renderer version always produce the same SVG.
          </p>
        </header>

        <div className="mt-7">
          <AgentSigilLab />
        </div>

        <aside className="mx-auto mt-5 max-w-4xl rounded-[1.25rem] border border-border/70 bg-card p-4 text-sm leading-relaxed text-muted-foreground shadow-[0_16px_38px_rgba(35,31,26,0.08)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.24)] sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Integration fence
          </p>
          <p className="mt-2">
            This route is the review surface. The guestbook and review lists keep their current presentation until the generated set is inspected in light and dark mode at mobile and desktop sizes.
          </p>
        </aside>
      </main>
    </ViewportPageShell>
  );
}
