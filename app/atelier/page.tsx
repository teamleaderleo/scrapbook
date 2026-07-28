import { PaperCreature } from '@/components/paper-creature';
import ViewportPageShell from '@/components/viewport-page-shell';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atelier',
  description: 'Experimental interface sketches and navigation ideas.',
  alternates: { canonical: '/atelier' },
};

const wheelLinks = [
  { href: '/proxy-dashboard', label: 'Signal', detail: 'proxy cockpit', angle: -90 },
  { href: '/space', label: 'Space', detail: 'notes and thoughts', angle: -38 },
  { href: '/gallery', label: 'Gallery', detail: 'visual objects', angle: 18 },
  {
    href: 'https://glossless.app/',
    label: 'Glossless',
    detail: 'writing tool',
    angle: 72,
    external: true,
  },
];

const futureNodes = [
  { label: 'Vault', detail: 'references, tags, sources' },
  { label: 'Reader', detail: 'PDFs, markdown, highlights' },
  { label: 'Wheel', detail: 'radial navigation sketch' },
];

export default function AtelierPage() {
  return (
    <ViewportPageShell className="bg-[#ecebe6] text-[#17181b] dark:bg-[#101115] dark:text-[#eeeae3]">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-end justify-between gap-5">
          <div>
            <span className="material-label-stamped text-[9px] text-black/55 dark:text-white/55">atelier</span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">A little interface workshop</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65 dark:text-white/65 sm:text-base">
              Rough navigation objects, reader ideas, and useful experiments laid out like pieces on a worktable.
            </p>
          </div>
          <div className="hidden text-center sm:block">
            <PaperCreature pose="carrying" size="lg" label="Scraplet carrying a pencil through the atelier" />
            <p className="mt-1 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-black/50 dark:text-white/50">
              workshop helper
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="material-paper relative overflow-hidden rounded-3xl border p-5 sm:p-7">
            <span className="material-tape-strip" data-side="top" aria-hidden="true" />
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] opacity-60">
                  worktable study
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">Navigation wheel</h2>
              </div>
              <span className="material-label-stamped text-[9px] opacity-60">paper prototype</span>
            </div>

            <p className="max-w-2xl text-sm leading-6 opacity-70 sm:text-base">
              A quiet place to test radial navigation, game-like controls, reference drawers, reader surfaces, and small dashboard objects.
            </p>

            <div className="mt-8">
              <div
                className="relative mx-auto aspect-square w-full max-w-[34rem] overflow-hidden rounded-[2rem] border border-black/14 bg-[#d9d5cb] p-6 shadow-inner dark:border-white/12 dark:bg-[#202126]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(72,65,54,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(72,65,54,0.055) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                <div className="absolute inset-6 rounded-full border border-black/12 dark:border-white/12" />
                <div className="absolute inset-12 rounded-full border border-dashed border-black/14 dark:border-white/12" />

                <div className="absolute left-1/2 top-1/2 z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2 sm:h-32 sm:w-32">
                  <div className="atelier-cube-scene h-full w-full">
                    <div className="atelier-cube">
                      <span className="atelier-cube-face atelier-cube-front" />
                      <span className="atelier-cube-face atelier-cube-back" />
                      <span className="atelier-cube-face atelier-cube-right" />
                      <span className="atelier-cube-face atelier-cube-left" />
                      <span className="atelier-cube-face atelier-cube-top" />
                      <span className="atelier-cube-face atelier-cube-bottom" />
                    </div>
                  </div>
                </div>

                {wheelLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch={item.external ? false : true}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className="group absolute left-1/2 top-1/2 z-20 flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border border-black/16 bg-[#f7f1df] px-3 py-2 text-center text-[#242328] shadow-[0_5px_12px_rgba(55,47,37,0.12)] transition-[border-color,background-color,box-shadow] hover:border-black/32 hover:bg-[#fffaf0] hover:shadow-[0_8px_18px_rgba(55,47,37,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/14 dark:bg-[#2a2928] dark:text-[#eeeae3] dark:hover:border-white/30 dark:hover:bg-[#33312f] sm:w-32"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${item.angle}deg) translateY(-11rem) rotate(${-item.angle}deg)`,
                    }}
                  >
                    <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                    <span className="mt-0.5 text-[11px] leading-tight opacity-60 group-hover:opacity-80">
                      {item.detail}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="material-paper relative overflow-hidden rounded-3xl border p-5">
            <span className="material-tape-strip" data-side="top" aria-hidden="true" />
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] opacity-60">
              Future shelves
            </div>
            <div className="mt-4 space-y-3">
              {futureNodes.map((node) => (
                <div key={node.label} className="rounded-2xl border border-dashed border-black/12 bg-white/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold tracking-tight">{node.label}</h2>
                    <span className="material-label-stamped text-[9px] opacity-55">sketch</span>
                  </div>
                  <p className="mt-1 text-sm opacity-65">{node.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <style>{`
          .atelier-cube-scene { perspective: 700px; }
          .atelier-cube {
            position: relative;
            height: 100%;
            width: 100%;
            transform-style: preserve-3d;
            animation: atelier-cube-spin 16s linear infinite;
          }
          .atelier-cube-face {
            position: absolute;
            inset: 0;
            border: 1px solid rgba(80, 76, 88, 0.4);
            background: linear-gradient(135deg, rgba(164, 151, 122, 0.42), rgba(112, 102, 84, 0.18));
            box-shadow: inset 0 0 22px rgba(45, 43, 50, 0.1);
          }
          .dark .atelier-cube-face {
            border-color: rgba(222, 215, 228, 0.36);
            background: linear-gradient(135deg, rgba(155, 148, 166, 0.28), rgba(75, 71, 82, 0.2));
          }
          .atelier-cube-front { transform: translateZ(3.5rem); }
          .atelier-cube-back { transform: rotateY(180deg) translateZ(3.5rem); }
          .atelier-cube-right { transform: rotateY(90deg) translateZ(3.5rem); }
          .atelier-cube-left { transform: rotateY(-90deg) translateZ(3.5rem); }
          .atelier-cube-top { transform: rotateX(90deg) translateZ(3.5rem); }
          .atelier-cube-bottom { transform: rotateX(-90deg) translateZ(3.5rem); }
          @media (min-width: 640px) {
            .atelier-cube-front { transform: translateZ(4rem); }
            .atelier-cube-back { transform: rotateY(180deg) translateZ(4rem); }
            .atelier-cube-right { transform: rotateY(90deg) translateZ(4rem); }
            .atelier-cube-left { transform: rotateY(-90deg) translateZ(4rem); }
            .atelier-cube-top { transform: rotateX(90deg) translateZ(4rem); }
            .atelier-cube-bottom { transform: rotateX(-90deg) translateZ(4rem); }
          }
          @media (prefers-reduced-motion: reduce) {
            .atelier-cube { animation: none; }
          }
          @keyframes atelier-cube-spin {
            from { transform: rotateX(-18deg) rotateY(0deg) rotateZ(6deg); }
            to { transform: rotateX(-18deg) rotateY(360deg) rotateZ(6deg); }
          }
        `}</style>
      </section>
    </ViewportPageShell>
  );
}
