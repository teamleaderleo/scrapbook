import ViewportPageShell from '@/components/viewport-page-shell';
import { ArrowLeft, Compass } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="grid min-h-[calc(100dvh-3rem)] place-items-center px-4 py-10"
    >
      <section className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-6 text-card-foreground shadow-[0_22px_60px_rgba(35,31,26,0.14)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.36)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rotate-12 rounded-[2rem] border border-dashed border-border/70 bg-muted/35"
        />

        <div className="relative">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-border/70 bg-background/70">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Room not found · 404
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            This door does not open.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            The room may have moved, or the address may belong to an older
            version of the workshop.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return home
            </Link>
            <Link
              href="/journal"
              className="inline-flex min-h-11 items-center rounded-xl border border-border/70 bg-background/55 px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Open the journal
            </Link>
          </div>
        </div>
      </section>
    </ViewportPageShell>
  );
}
