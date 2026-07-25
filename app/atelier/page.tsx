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
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/55 dark:text-white/55">
            Atelier
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
            Experimental interface room
          </h1>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="rounded-3xl border border-black/14 bg-[#f2f0ea] p-5 shadow-sm dark:border-white/12 dark:bg-[#18191d] sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/55 dark:text-white/55">
                  interface study
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">
                  Navigation wheel
                </h2>
              </div>
              <div className="rounded-full border border-black/12 bg-[#dedad2] px-3 py-1 text-xs font-medium text-[#242328] dark:border-white/12 dark:bg-[#25262c] dark:text-[#eeeae3]">
                CSS object
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-black/68 dark:text-white/68 sm:text-base">
              A quiet place to test radial navigation, game UI, reference-vault sketches,
              reader surfaces, and small dashboard objects.
            </p>

            <div className="mt-8">
              <div className="relative mx-auto aspect-square w-full max-w-[34rem] overflow-hidden rounded-[2rem] border border-black/14 bg-[#dedbd4] p-6 shadow-inner dark:border-white/12 dark:bg-[#202126]">
                <div className="absolute inset-6 rounded-full border border-black/12 dark:border-white/12" />
                <div className="absolute inset-12 rounded-full border border-dashed border-black/12 dark:border-white/12" />

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
                    className="group absolute left-1/2 top-1/2 z-20 flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border border-black/16 bg-[#f7f4ed] px-3 py-2 text-center text-[#242328] shadow-sm transition hover:-translate-y-[calc(50%+2px)] hover:border-black/32 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/14 dark:bg-[#18191d] dark:text-[#eeeae3] dark:hover:border-white/30 dark:hover:bg-[#222329] sm:w-32"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${item.angle}deg) translateY(-11rem) rotate(${-item.angle}deg)`,
                    }}
                  >
                    <span className="text-sm font-semibold tracking-tight">
                      {item.label}
                    </span>
                    <span className="mt-0.5 text-[11px] leading-tight text-black/58 group-hover:text-black/78 dark:text-white/58 dark:group-hover:text-white/80">
                      {item.detail}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-black/14 bg-[#f2f0ea] p-5 shadow-sm dark:border-white/12 dark:bg-[#18191d]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/55 dark:text-white/55">
              Future shelves
            </div>
            <div className="mt-4 space-y-3">
              {futureNodes.map((node) => (
                <div key={node.label} className="rounded-2xl border border-black/12 bg-[#e8e5de] p-4 dark:border-white/10 dark:bg-[#222329]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold tracking-tight">{node.label}</h2>
                    <span className="rounded-full border border-black/12 px-2 py-0.5 text-[11px] text-black/58 dark:border-white/12 dark:text-white/58">
                      sketch
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-black/65 dark:text-white/65">{node.detail}</p>
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
            border: 1px solid rgba(80, 76, 88, 0.48);
            background: linear-gradient(135deg, rgba(130, 124, 140, 0.42), rgba(90, 86, 98, 0.18));
            box-shadow: inset 0 0 22px rgba(45, 43, 50, 0.12);
          }
          .dark .atelier-cube-face {
            border-color: rgba(222, 215, 228, 0.42);
            background: linear-gradient(135deg, rgba(155, 148, 166, 0.32), rgba(75, 71, 82, 0.24));
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
