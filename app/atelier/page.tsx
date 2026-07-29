import ViewportPageShell from '@/components/viewport-page-shell';
import { Snowflake } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

export const metadata: Metadata = {
  title: 'Atelier',
  description: 'Experimental interface sketches and navigation ideas.',
  alternates: { canonical: '/atelier' },
};

const wheelLinks = [
  { href: '/proxy-dashboard', label: 'Signal', detail: 'proxy', angle: -90 },
  { href: '/space', label: 'Space', detail: 'notes', angle: -25 },
  { href: '/gallery', label: 'Gallery', detail: 'objects', angle: 40 },
  {
    href: 'https://glossless.app/',
    label: 'Glossless',
    detail: 'writing',
    angle: 105,
    external: true,
  },
];

export default function AtelierPage() {
  return (
    <ViewportPageShell className="bg-[#ecebe6] text-[#17181b] dark:bg-[#101115] dark:text-[#eeeae3]">
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header>
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-black/55 dark:text-white/55">
            Atelier
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">Interface workshop</h1>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="rounded-3xl border border-black/12 bg-[#f3f0e8] p-4 shadow-[0_18px_48px_rgba(55,47,37,0.1)] dark:border-white/12 dark:bg-[#1b1c21] sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Navigation wheel</h2>

            <div className="mt-4">
              <div className="relative mx-auto aspect-square w-full max-w-[34rem] overflow-hidden rounded-[2rem] border border-black/14 bg-[#d9d5cb] shadow-inner dark:border-white/12 dark:bg-[#202126]">
                <div className="absolute inset-[12%] rounded-full border border-black/12 dark:border-white/12" />
                <div className="absolute inset-[25%] rounded-full border border-dashed border-black/14 dark:border-white/12" />

                <div className="absolute left-1/2 top-1/2 z-10 h-20 w-20 -translate-x-1/2 -translate-y-1/2 sm:h-28 sm:w-28">
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
                    className="atelier-wheel-link group absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border border-black/16 bg-[#f7f1df] px-2 py-2 text-center text-[#242328] shadow-[0_5px_12px_rgba(55,47,37,0.12)] transition-[border-color,background-color,box-shadow] hover:border-black/32 hover:bg-[#fffaf0] hover:shadow-[0_8px_18px_rgba(55,47,37,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/14 dark:bg-[#2a2928] dark:text-[#eeeae3] dark:hover:border-white/30 dark:hover:bg-[#33312f]"
                    style={
                      {
                        '--wheel-angle': `${item.angle}deg`,
                        '--wheel-counter-angle': `${-item.angle}deg`,
                      } as CSSProperties
                    }
                  >
                    <span className="text-xs font-semibold tracking-tight sm:text-sm">{item.label}</span>
                    <span className="mt-0.5 hidden text-[11px] leading-tight opacity-60 sm:block">
                      {item.detail}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside>
            <Link
              href="/snow-globe"
              prefetch
              className="group flex min-h-44 flex-col justify-between rounded-3xl border border-black/12 bg-[#f3f0e8] p-5 shadow-[0_18px_48px_rgba(55,47,37,0.1)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(55,47,37,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/12 dark:bg-[#1b1c21]"
              data-atelier-snow-globe
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-black/12 bg-white/35 dark:border-white/12 dark:bg-white/5">
                <Snowflake className="h-6 w-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-2xl font-semibold tracking-tight">Snow globe</span>
                <span className="mt-1 block text-sm opacity-65">Drag, tilt, and shake.</span>
              </span>
            </Link>
          </aside>
        </section>

        <style>{`
          .atelier-wheel-link {
            width: 5.75rem;
            transform: translate(-50%, -50%) rotate(var(--wheel-angle)) translateY(-6.6rem) rotate(var(--wheel-counter-angle));
          }
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
          .atelier-cube-front { transform: translateZ(2.5rem); }
          .atelier-cube-back { transform: rotateY(180deg) translateZ(2.5rem); }
          .atelier-cube-right { transform: rotateY(90deg) translateZ(2.5rem); }
          .atelier-cube-left { transform: rotateY(-90deg) translateZ(2.5rem); }
          .atelier-cube-top { transform: rotateX(90deg) translateZ(2.5rem); }
          .atelier-cube-bottom { transform: rotateX(-90deg) translateZ(2.5rem); }
          @media (min-width: 640px) {
            .atelier-wheel-link {
              width: 8rem;
              transform: translate(-50%, -50%) rotate(var(--wheel-angle)) translateY(-10.5rem) rotate(var(--wheel-counter-angle));
            }
            .atelier-cube-front { transform: translateZ(3.5rem); }
            .atelier-cube-back { transform: rotateY(180deg) translateZ(3.5rem); }
            .atelier-cube-right { transform: rotateY(90deg) translateZ(3.5rem); }
            .atelier-cube-left { transform: rotateY(-90deg) translateZ(3.5rem); }
            .atelier-cube-top { transform: rotateX(90deg) translateZ(3.5rem); }
            .atelier-cube-bottom { transform: rotateX(-90deg) translateZ(3.5rem); }
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
