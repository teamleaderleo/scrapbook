import Link from 'next/link';
import SiteNav from '@/components/site-nav';

const wheelLinks = [
  { href: '/proxy-dashboard', label: 'Signal', detail: 'proxy cockpit', angle: -90 },
  { href: '/space', label: 'Space', detail: 'notes and thoughts', angle: -38 },
  { href: '/gallery', label: 'Cube', detail: 'visual objects', angle: 18 },
  { href: 'https://glossless.app/', label: 'Glossless', detail: 'writing tool', angle: 72, external: true },
];

const futureNodes = [
  { label: 'Vault', detail: 'references, tags, sources' },
  { label: 'Reader', detail: 'PDFs, markdown, highlights' },
  { label: 'Wheel', detail: 'radial navigation sketch' },
];

export default function AtelierPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(184,181,255,0.18),_transparent_34rem)] text-foreground">
      <SiteNav />
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Atelier</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">Experimental interface room</h1>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="rounded-3xl border bg-background/80 p-5 shadow-sm backdrop-blur sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">lavender build</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">Weapon wheel</h2>
              </div>
              <div className="rounded-full border bg-[#b8b5ff]/15 px-3 py-1 text-xs font-medium text-foreground">CSS cube</div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              A quiet place to test radial navigation, soft game UI, reference-vault sketches, reader surfaces, and small dashboard objects.
            </p>

            <div className="mt-8">
              <div className="relative mx-auto aspect-square w-full max-w-[34rem] rounded-[2rem] border bg-[radial-gradient(circle_at_center,rgba(184,181,255,0.18),transparent_58%)] p-6 shadow-inner">
                <div className="absolute inset-6 rounded-full border border-[#b8b5ff]/20" />
                <div className="absolute inset-12 rounded-full border border-dashed border-[#b8b5ff]/20" />

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
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className="group absolute left-1/2 top-1/2 z-20 flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border bg-background/85 px-3 py-2 text-center shadow-sm backdrop-blur transition hover:-translate-y-[calc(50%+2px)] hover:border-[#b8b5ff]/70 hover:bg-[#b8b5ff]/15 focus:border-[#b8b5ff]/70 focus:outline-none focus:ring-2 focus:ring-[#b8b5ff]/30 sm:w-32"
                    style={{ transform: `translate(-50%, -50%) rotate(${item.angle}deg) translateY(-11rem) rotate(${-item.angle}deg)` }}
                  >
                    <span className="text-sm font-semibold tracking-tight text-foreground">{item.label}</span>
                    <span className="mt-0.5 text-[11px] leading-tight text-muted-foreground group-hover:text-foreground">{item.detail}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border bg-background/80 p-5 shadow-sm backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Future shelves</div>
            <div className="mt-4 space-y-3">
              {futureNodes.map((node) => (
                <div key={node.label} className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold tracking-tight">{node.label}</h2>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">sketch</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{node.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <style>{`
          .atelier-cube-scene {
            perspective: 700px;
          }

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
            border: 1px solid rgba(184, 181, 255, 0.65);
            background: linear-gradient(135deg, rgba(184, 181, 255, 0.2), rgba(184, 181, 255, 0.04));
            box-shadow: inset 0 0 28px rgba(184, 181, 255, 0.18), 0 0 22px rgba(184, 181, 255, 0.12);
            backdrop-filter: blur(10px);
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

          @keyframes atelier-cube-spin {
            from { transform: rotateX(-18deg) rotateY(0deg) rotateZ(6deg); }
            to { transform: rotateX(-18deg) rotateY(360deg) rotateZ(6deg); }
          }
        `}</style>
      </section>
    </main>
  );
}
