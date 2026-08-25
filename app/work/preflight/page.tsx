import ViewportPageShell from '@/components/viewport-page-shell';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Preflight · Work',
  description:
    'A deeper look at the performance, storage, runtime, and product engineering behind Preflight.',
  alternates: { canonical: '/work/preflight' },
};

const stories = [
  {
    title: 'The shared data boundary',
    body:
      'Five loader-specific JSON/CSV caches cut one major loading seam, but profiling showed that the same merge-and-parse work was still repeated below them. One measured launch issued 39,017 JSON calls across 8,378 paths. Moving the repeated work into a shared memoized reader took the remaining merged-read seam from 2.172s to 0.300s, while typed-tree replay avoided reparsing stored JSON text.',
    receipt: '39,017 calls · 8,378 paths · 2.172s → 0.300s',
  },
  {
    title: 'The cache was behind the bottleneck',
    body:
      'Prepared texture data initially looked healthy in local hit counters but barely moved the whole launch. The reason was placement: the loading thread could still wait roughly 27 seconds behind a single-threaded texture-prefetch queue before the cache decision happened. Moving that decision earlier changed the critical path. Later upload work also removed 1.22 GiB of power-of-two VRAM padding.',
    receipt: '~27s serialized wait · 1.22 GiB VRAM padding removed',
  },
  {
    title: 'Rebuildable data is not durable data',
    body:
      'Texture preparation originally forced thousands of rebuildable intermediates to disk before publishing the final pack. Streaming those intermediates into one final durable pack changed both preparation cost and footprint. After that, the same logical texture corpus launched much faster when the pack was written in observed startup order instead of alphabetical order.',
    receipt: '200.77s → 16.21s · 4.76 GB → ~1.1 GB · 33.53s → 14.174s',
  },
  {
    title: 'Generated code had two different duplication problems',
    body:
      'Memoizing Janino requests removed repeated compilation first. The persisted cache then exposed a second problem: 36,332 generated-class occurrences contained only 280 unique classes. Deduplicating the stored representation collapsed the class maps from 145.96 MiB to 1.13 MiB and made replay dramatically cheaper.',
    receipt: '18.014s → 2.364s · 36,332 → 280 classes · 145.96 MiB → 1.13 MiB',
  },
  {
    title: 'The same method found runtime work after startup',
    body:
      'Campaign profiling found repeated sector-wide entity validation and commodity recomputation. Mutation-tracked indexes removed the expensive full-list validation path, while a memoized commodity path served unchanged state directly and delegated real changes back to the original implementation. The work is presented as operation-count reduction rather than an invented universal FPS claim.',
    receipt: '79.1M entity-reference checks → 0 · 117.9M unchanged recomputations skipped',
  },
] as const;

const links = [
  {
    label: 'Preflight repository',
    href: 'https://github.com/teamleaderleo/preflight',
  },
  {
    label: 'Engineering overview',
    href: 'https://github.com/teamleaderleo/preflight/blob/main/docs/engineering-overview.md',
  },
  {
    label: 'Optimization history',
    href: 'https://github.com/teamleaderleo/preflight/blob/main/docs/optimization-history.md',
  },
] as const;

export default function PreflightWorkPage() {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="min-h-[calc(100dvh-3rem)]"
    >
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-7 sm:px-6 sm:pt-10 lg:px-8">
        <header className="border-y border-border py-7 sm:py-10">
          <Link
            href="/work"
            className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground underline decoration-transparent underline-offset-4 hover:text-foreground hover:decoration-current"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Work
          </Link>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] lg:items-end">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Performance launcher · runtime investigation · desktop product
              </p>
              <h1 className="mt-3 text-[clamp(3.5rem,10vw,7.5rem)] font-black leading-[0.84] tracking-[-0.065em]">
                Preflight
              </h1>
              <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-foreground/80 sm:text-xl">
                Heavily modded Starsector went from roughly 101 seconds at the observed early high to a 13.69-second best development run. The useful story is how that happened: profile the real system, find repeated work at the boundary that owns it, preserve the original path when the proof stops holding, then measure again.
              </p>
            </div>

            <aside className="border-l-2 border-border pl-4">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Current status
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/75">
                Public open-source release candidate. The same Java engine now powers a Windows/macOS/Linux desktop app with React over a Rust/Tauri host, a bundled Java runtime, durable launch/playtime history, and signed updates with rollback.
              </p>
            </aside>
          </div>
        </header>

        <section className="pt-10" aria-labelledby="preflight-pattern-title">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            The pattern
          </p>
          <h2
            id="preflight-pattern-title"
            className="mt-2 max-w-4xl text-3xl font-black tracking-[-0.035em] sm:text-4xl"
          >
            Most of the large wins were boundary corrections.
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-7 text-foreground/78 sm:text-lg sm:leading-8">
            The first implementation was often locally correct and globally misplaced. Five caches pointed to a lower common read boundary. A valid texture cache sat after the expensive queue it was supposed to avoid. Rebuildable texture data was treated as though every intermediate file needed durability. Generated code was cached before anyone noticed that the cached representation itself was massively duplicated.
          </p>
        </section>

        <ol className="mt-10 grid gap-10" aria-label="Preflight engineering stories">
          {stories.map((story, index) => (
            <li key={story.title} className="border-t border-border pt-5">
              <article className="grid gap-5 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
                <div>
                  <p className="font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <p className="mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                    {story.receipt}
                  </p>
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.025em] sm:text-3xl">
                    {story.title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/78 sm:text-base">
                    {story.body}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>

        <section className="mt-12 grid gap-6 border-y border-border py-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Compatibility is part of the optimization
            </p>
            <p className="mt-3 max-w-3xl text-base leading-7 text-foreground/78">
              Preflight does not permanently rewrite the game or mod JARs. Prepared artifacts and runtime adapters are bound to the inputs and code they were reviewed against. When a target changes or cannot be proven safe, the optimization declines and the game&apos;s original behavior remains available. In a system assembled from obfuscated game code, third-party mods, mutable JSON objects, generated classes, and changing archives, that fallback boundary is part of the performance design rather than cleanup afterward.
            </p>
          </div>

          <aside>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Read the receipts
            </p>
            <ul className="mt-2 divide-y divide-border border-y border-border">
              {links.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex min-h-11 items-center justify-between gap-3 py-2.5 text-sm font-semibold underline decoration-transparent underline-offset-4 hover:decoration-current"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="pt-10" aria-labelledby="preflight-reversal-title">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Useful reversal
          </p>
          <h2
            id="preflight-reversal-title"
            className="mt-2 text-2xl font-black tracking-[-0.025em] sm:text-3xl"
          >
            A cache can work perfectly and still be useless.
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-7 text-foreground/78">
            The prepared-texture cache had healthy hit counters. It was also checked after the loading thread had already waited behind the single-threaded prefetch queue. That failure changed how I approached the rest of the project: measure the owner of the delay, not the component that happens to be nearby, and keep the failed-but-informative experiments in the record.
          </p>
        </section>
      </main>
    </ViewportPageShell>
  );
}
